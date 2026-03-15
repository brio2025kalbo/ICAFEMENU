function stop_game_timers()
{
	if (theQueryRunGameIdsIntervalId != null) {
		clearInterval(theQueryRunGameIdsIntervalId);
		theQueryRunGameIdsIntervalId = null;
	}

	if (theGameTrackerInterval != null) {
		clearInterval(theGameTrackerInterval);
		theGameTrackerInterval = null;
	}

	countdown_stop();
}

function query_rungame_ids()
{
	CallFunction("RUNGAME_QUERY_IDS");
}

function GameList()
{
	this.filter_params = { type: 'home', class: '', search: '' };
	this.member_recent_played = [];
	this.member_favorite_games = []; // 用户收藏的游戏列表
	this.local_hot_sorted_games = [];
	
	this.deliver_password_for_games = [];
	if (typeof(theSettings.deliver_password_for_games) != 'undefined' && theSettings.deliver_password_for_games != null) {
		this.deliver_password_for_games = JSON.parse(theSettings.deliver_password_for_games);
	}
	this.lockStartGame = {};
	// 进入GAMES页后，所有的处理要重新处理，可以重进入（例如：已经是GAMES页，再进入时，LEFT_TIME要重启一下
	// 置thePCStatus时，就要重启left_time.
	this.show = function(refreshBalance = false) {
		var that = this;

		that.clear_game_info();
		
		that.local_hot_sorted_games = [];
		theGames.sort(that.local_hot_compare).forEach(game => {
			if (game.pkg_name.toLowerCase() === 'icafemenu' || game.pkg_name.toLowerCase() === 'overwolf')
				return;
			that.local_hot_sorted_games.push(game);
		});

		for (var i=0; i<that.local_hot_sorted_games.length; i++) {
			that.local_hot_sorted_games[i].local_hot_rank = i+1;
		}
		//$('#top-buttons .dropdown-menu').html(tmpl('tmpl-more-games-classes', { items: theClasses == null ? [] : theClasses.sort(that.class_compare) }));
		//translate_obj($('#top-buttons'));

		if(theClasses == null)
			theClasses = [];
		theClasses = theClasses.filter((item) => {
			item.game_count = 0;
			for (var i=0; i<theGames.length; i++) {
				if(theGames[i].pkg_idc_class == item.class_name && theGames[i].pkg_name.toLowerCase() != 'icafemenu' && theGames[i].pkg_name.toLowerCase() != 'overwolf')
					item.game_count ++;
			}
			if(item.game_count == 0)
				return false;
			return true;
		});

		let gameClass = [
			{class_name: 'More', icon: 'fa-bars', subClasses: []},
			{class_name: 'Favorite', icon: 'fa-star'},
			{class_name: 'Free to play', icon: 'fa-bookmark'},
		];

		gameClass[0]['subClasses'] = theClasses;
		vueClasses.items = JSON.parse(JSON.stringify(gameClass));
		
		PetiteVue.nextTick(() => {
			ui_init();
			$('[data-toggle="tooltip"]').tooltip();
			that.load_games_by_class('class', 'All Games', '');
		});

		// 搜索功能改为使用 Vue 响应式状态
		// 模板中应使用 v-model="vueGames.search" 绑定搜索输入框
		// 并使用 @input="theGameList.onSearchInput()" 触发搜索
	
		setDropdownMenu();

		// load favorite games from client_status package (member_recent_played 现在用于存储收藏)
		if (typeof(thePCStatus.member_recent_played) != 'undefined' && thePCStatus.member_recent_played != null) {
			try {
				that.member_favorite_games = JSON.parse(thePCStatus.member_recent_played);
			} catch(e) {
				that.member_favorite_games = [];
			}
		}
		// 为每个游戏设置 member_favorite 属性
		that.local_hot_sorted_games.forEach(function(game) {
			game.member_favorite = that.is_favorite(game.pkg_id);
		});
		if (refreshBalance) {
			refreshBalanceInfo();
		}
	}

	this.local_hot_compare = function(a, b) {
		var a_is_favorite = a.pkg_favorite;
		var b_is_favorite = b.pkg_favorite;

		var a_value = a.pkg_local_hot || 0;
		var b_value = b.pkg_local_hot || 0;

		if (a_is_favorite && !b_is_favorite)
			return -1;

		if (!a_is_favorite && b_is_favorite)
			return 1;

		if (a_value < b_value)
			return 1;
		if (a_value > b_value)
			return -1;

		return 0;
	}

	this.is_recent_played = function(pkg_id) {
		var exists = false;
		this.member_recent_played.forEach(function(game) {
			if (game.pkg_id === parseInt(pkg_id))
				exists = true;
		})
		return exists;
	}

	// 检查游戏是否已收藏
	this.is_favorite = function(pkg_id) {
		var targetId = parseInt(pkg_id);
		for (var i = 0; i < this.member_favorite_games.length; i++) {
			var game = this.member_favorite_games[i];
			if (parseInt(game.pkg_id) === targetId) {
				return true;
			}
		}
		return false;
	}

	// 切换收藏状态
	this.toggle_favorite = async function(pkg_id) {
		var that = this;
		try {
			const data = await theApiClient.callCafeApi('toggleFavoriteGame', 'POST', {
				pkg_id: pkg_id
			});
			
			if (data && data.favorite_games) {
				that.member_favorite_games = data.favorite_games;
				// 同步更新 thePCStatus.member_recent_played，确保 Home 页面能获取最新数据
				thePCStatus.member_recent_played = JSON.stringify(data.favorite_games);
				
				// 更新游戏列表中的收藏状态
				that.local_hot_sorted_games.forEach(function(game) {
					game.member_favorite = that.is_favorite(game.pkg_id);
				});
				
				if (vueGameInfo.game) {
					vueGameInfo.game.member_favorite = that.is_favorite(vueGameInfo.game.pkg_id);
				}
				
				// 如果当前在收藏分类页面，取消收藏后需要从列表中移除该游戏
				if (that.filter_params.type === 'favorite' && !data.is_favorite) {
					// 从列表中过滤掉已取消收藏的游戏
					if (vueGames && vueGames.allFilteredItems) {
						vueGames.allFilteredItems = vueGames.allFilteredItems.filter(function(game) {
							return game.pkg_id !== pkg_id;
						});
					}
					if (vueGames && vueGames.items) {
						vueGames.items = vueGames.items.filter(function(game) {
							return game.pkg_id !== pkg_id;
						});
					}
				} else {
					// 更新 vueGames 中的收藏状态，通过重新赋值数组来触发 Vue 响应式更新
					if (vueGames && vueGames.allFilteredItems) {
						vueGames.allFilteredItems = vueGames.allFilteredItems.map(function(game) {
							return Object.assign({}, game, { member_favorite: that.is_favorite(game.pkg_id) });
						});
					}
					if (vueGames && vueGames.items) {
						vueGames.items = vueGames.items.map(function(game) {
							return Object.assign({}, game, { member_favorite: that.is_favorite(game.pkg_id) });
						});
					}
				}
				
				// 检查是否有警告信息（如达到收藏上限）
				if (data.warning) {
					toastr.warning(translate_string(data.warning), '', { timeOut: 3000, extendedTimeOut: 1000 });
				} else if (data.is_favorite) {
					toastr.success(translate_string('Added to favorites'), '', { timeOut: 2000, extendedTimeOut: 1000 });
				} else {
					toastr.info(translate_string('Removed from favorites'), '', { timeOut: 2000, extendedTimeOut: 1000 });
				}
			}
		} catch(e) {
			console.error('toggle_favorite error:', e);
			ICafeApiError.show(e);
		}
	}

	// 搜索输入处理函数，由模板中 @input 调用
	this.onSearchInput = function() {
		var that = this;
		var new_search = vueGames.search;
		if (that.filter_params.search.toLowerCase() == new_search.toLowerCase())
			return;
		that.load_games_by_class('class', 'All Games', new_search);
	};

	this.observer = null;

	this.init_observer = function() {
		var that = this;
		if (this.observer) return;

		var games_element = document.getElementById('games');
		if (!games_element) return;

		this.observer = new ResizeObserver((entries) => {
			for (let entry of entries) {
				const { width, height } = entry.contentRect;
				// update Vue state
				if (vueGames.containerWidth !== width || vueGames.containerHeight !== height) {
					vueGames.containerWidth = width;
					vueGames.containerHeight = height;
					that.refresh_visible_items();
				}
			}
		});
		this.observer.observe(games_element);
	}

	this.refresh_visible_items = function() {
		var limit_count = Math.MAX_VALUE;
		if (vueGames.type === 'home') {
			var games_width = vueGames.containerWidth || 0;
			var games_height = (vueGames.containerHeight || 0) - 20;

			var item_width = 168+15;
			var item_height = 264+15;

			if (item_width > 0 && games_width > 0) {
				var cols = Math.max(Math.floor(games_width / item_width), 2);
				var rows = Math.max(Math.floor(games_height / item_height), 2);
				limit_count = cols * rows;
			}
		}

		// Apply limit to the filtered list
		if (vueGames.type === 'home' && limit_count > 0 && limit_count < vueGames.allFilteredItems.length) {
			vueGames.items = vueGames.allFilteredItems.slice(0, limit_count);
		} else {
			vueGames.items = vueGames.allFilteredItems;
		}

		PetiteVue.nextTick(() => {
			ui_init();
			$('[data-toggle="tooltip"]').tooltip();
		});
	}

	this.load_games_by_class = function(type, class_name, search) {
		if(class_name == 'Favorite')
			type = 'favorite'; // 改为 favorite 类型，显示用户收藏的游戏
		if(class_name == 'All Games')
			type = 'all';
		if(class_name == 'Free to play')
			type = 'license';

		acitve_class = class_name;
		class_name = decodeURIComponent(class_name);
		acitve_class = decodeURIComponent(acitve_class);
		
		var that = this;

		that.filter_params = { type: type, class: class_name, search: search };
		vueGames.search = search;
		
		var sorted_games = that.local_hot_sorted_games.sort(that.local_hot_compare);
		var show_games = [];
		sorted_games.forEach(function(game) {
			if (type === 'home' && that.is_recent_played(game.pkg_id))
				return;

			if (type === 'home' && (game.pkg_idc_class.toLowerCase() === 'internet tools' || game.pkg_idc_class.toLowerCase() === 'Apps'))
				return;

			if (game.pkg_name.toLowerCase() === 'icafemenu' || game.pkg_name.toLowerCase() === 'overwolf')
				return;

			if (type === 'license' && !game.pkg_has_license)
				return;

			// 收藏分类：只显示用户收藏的游戏
			if (type === 'favorite' && !that.is_favorite(game.pkg_id))
				return;

			if (type === 'class' && class_name.length > 0 && game.pkg_idc_class != class_name)
				return;

			if (search.length > 0 && game.pkg_name.toLowerCase().indexOf(search.toLowerCase()) < 0)
				return;

			// pc groups
			var pkg_pc_group_ids = typeof(game.pkg_pc_group_ids) != 'undefined' ? game.pkg_pc_group_ids : [];
			if (pkg_pc_group_ids.length > 0 && pkg_pc_group_ids.indexOf(thePCStatus.pc_group_id) < 0)
				return;

			if (game.pkg_rating > 0)
			{
				if(thePCStatus.member_birthday == null || thePCStatus.member_birthday == '0000-00-00')
				{
					if(game.pkg_rating > 13) // default age is 13 years
						return;
				}
				else
				{
					var cols = thePCStatus.member_birthday.split('-');
					if (cols.length === 3) {
						var year = cols[0];
						var month = cols[1];
						var day = cols[2];

						// 获取当前日期
						var currentDate = new Date();
						// 获取出生日期
						var dob = new Date(year, month, day);
						// 计算年龄
						var age = currentDate.getFullYear() - dob.getFullYear();
						// 如果当前月份小于出生月份，或者当前月份等于出生月份但是当前日期小于出生日期，则年龄减一
						if (currentDate.getMonth() < dob.getMonth() || (currentDate.getMonth() == dob.getMonth() && currentDate.getDate() < dob.getDate())) {
							age--;
						}
						if (age < game.pkg_rating)
							return;
					}
					else
					{
						if(game.pkg_rating > 13) // default age is 13 years
							return;
					}
				}
			}

			// NOT limiting count here anymore, just filtering
			if (type === 'home' && show_games.length >= theGames.length) // safeguard, though logic changed
				return;

			show_games.push(game);
		});

		if (type === 'home') {
			for (var i=theGameList.member_recent_played.length-1; i>=0; i--) {
				that.local_hot_sorted_games.forEach(function(game) {
					if (theGameList.member_recent_played[i].pkg_id == game.pkg_id)
					{
						var pkg_pc_group_ids = typeof(game.pkg_pc_group_ids) != 'undefined' ? game.pkg_pc_group_ids : [];
						if (pkg_pc_group_ids.length > 0 && pkg_pc_group_ids.indexOf(thePCStatus.pc_group_id) < 0)
							return;
						show_games.unshift(game);
					}
				})
			}
		}
		
		// Update Vue state
		vueGames.allFilteredItems = show_games;
		vueGames.type = type;
		vueGames.active_class = acitve_class;
		vueGames.status_pc_token = thePCStatus.status_pc_token;

		vueGlobal.pageType = "Games";
		vueGlobal.showBottom = true;

		PetiteVue.nextTick(() => {
			ui_init();
			that.init_observer(); // Ensure observer is running
			that.refresh_visible_items(); // Calculate visible items
		});
	}

	this.play_game = async function (pkg_id, status_pc_token, use_icafecloud_license, license_account, game_auto_launch_delay, deliver_password_play) {
		// lock click
		const last_click = this.lockStartGame[`${pkg_id}`] || 0
		if (Date.now() - last_click < 3000) return;
		this.lockStartGame[`${pkg_id}`] = Date.now()
		
		// if use license pool, cover show/hide control by pool, else show cover 3 seconds, prevent users click repeatedly
		if (deliver_password_play) {
			//No more delays in getting passwords
			CallFunction("RUNGAME " + pkg_id + " " + status_pc_token + " 0 " + 0);
		} else {
			CallFunction("RUNGAME " + pkg_id + " " + status_pc_token + " 0 " + use_icafecloud_license + " " + license_account + " " + game_auto_launch_delay);
		}
		
		//TODO use http api
		var params = 'type=update-hot&id=' + pkg_id + '&token=' + thePCStatus.status_pc_token;
		CallFunction('API ' + params);
		
		var that = this;

		for (var i=0; i<that.member_recent_played.length; i++) {
			if (that.member_recent_played[i].pkg_id === parseInt(pkg_id)) {
				that.member_recent_played.splice(i, 1);
				break;
			}
		}

		that.member_recent_played.unshift({ pkg_id: parseInt(pkg_id) });
		if (that.member_recent_played.length > 5)
			that.member_recent_played.splice(5,that.member_recent_played.length - 5);
		
		//Get account information and pop up a window
		if (deliver_password_play) {
			const data = await theApiClient.callCafeApi('accountRequest', 'GET', {
				pc_name: thePCInfo.pc_name,
				pkg_id: pkg_id,
				license_account: license_account
			}).catch(ICafeApiError.show)
			
			copy_game_license_show_dialog(data.game.account, data.game.password);
		}
	}
	
	var menu_target_id = null;
	
	this.open_detail = function(game, source = 'game') {
		vueGameInfo.game = game;
		vueGameInfo.source = source;
		vueGameInfo.show = true;
	}
	
	this.back_to_list = function() {
		this.clear_game_info();
	}
	
	this.clear_game_info = function() {
		vueGameInfo.game = null;
		vueGameInfo.show = false;
		PetiteVue.nextTick(() => {
			ui_init();
			$('[data-toggle="tooltip"]').tooltip();
		});
	}
	
	this.close = function(pkg_id) {
		CallFunction("RUNGAME_TERMINATE " + pkg_id);
		
		query_rungame_ids();
	}

	this.request_game_licenses = async function(pkg_id, target_id) {
		var that = this;
		$.contextMenu('destroy', '#btn-play-with-license-' + pkg_id);
		$.contextMenu('destroy', '#btn-home-play-with-license-' + pkg_id);
		this.menu_target_id = target_id;
		
		const data = await theApiClient.callCafeApi('gameLicenses','post',{
			pc_name: thePCInfo.pc_name,
			pkg_id: pkg_id
		}).catch(ICafeApiError.show)
		if(!data){
			return;
		}
		$.contextMenu({
			selector: '#' + this.menu_target_id,
			className: 'play-with-license-title',
			trigger: 'none',
			build: function($trigger, e) {
				e.preventDefault();

				var items = {};
				if (data.licenses.length == 0)
					items['no_free_account'] = { name: translate_string('No free account'), disabled: true };

				if (data.licenses.length > 0) {
					var show_licenses = data.licenses.sort(that.game_licenses_sort);
					show_licenses.forEach(function (license) {
						items[license.license_account] = {
							name: license.license_account,
							disabled: ((license.license_status || '').toUpperCase() != 'FREE'),
							icon: ((license.license_status || '').toUpperCase() != 'FREE' ? 'fal fa-lock' : '')
						};
					});
				}

				return {
					callback: function(key, options) {
						var game_auto_launch_delay = typeof(data.game_auto_launch_delay) != 'undefined' ? data.game_auto_launch_delay : 0;
						var deliver_password_play = typeof(data.deliver_password_play) != 'undefined' ? data.deliver_password_play : false;
						theGameList.play_game(data.pkg_id, thePCStatus.status_pc_token, 1, key, game_auto_launch_delay, deliver_password_play);
					},
					items: items
				};
			}
		});

		$('#' + this.menu_target_id).trigger('contextmenu');
		
	}

	this.game_licenses_sort = function(a, b) {
		var a_value = ((a.license_status || '').toUpperCase() == 'FREE' ? 1 : 0);
		var b_value = ((b.license_status || '').toUpperCase() == 'FREE' ? 1 : 0);

		return b_value - a_value;
	}
	
	this.is_running_pkg = function (pkg_id) {
		if (!pkg_id) return false;
		return vueGlobal.runningGames.some(item => item.pkg_id == pkg_id)
	}

	ICAFEMENU_CORE.onWss('game_licenses', packet => {
		var that = this;
		$.contextMenu({
			selector: '#' + that.menu_target_id,
			className: 'play-with-license-title',
			trigger: 'none',
			build: function ($trigger, e) {
				e.preventDefault();

				var items = {};
				if (packet.data.licenses.length == 0)
					items['no_free_account'] = { name: translate_string('No free account'), disabled: true };

				if (packet.data.licenses.length > 0) {
					var show_licenses = packet.data.licenses.sort(that.game_licenses_sort);
					show_licenses.forEach(function (license) {
						items[license.license_account] = {
							name: license.license_account,
							disabled: ((license.license_status || '').toUpperCase() != 'FREE'),
							icon: ((license.license_status || '').toUpperCase() != 'FREE' ? 'fal fa-lock' : '')
						};
					});
				}

				return {
					callback: function(key, options) {
						var game_auto_launch_delay = typeof(packet.data.game_auto_launch_delay) != 'undefined' ? packet.data.game_auto_launch_delay : 0;
						var deliver_password_play = typeof(data.deliver_password_play) != 'undefined' ? data.deliver_password_play : false;
						theGameList.play_game(packet.data.pkg_id, thePCStatus.status_pc_token, 1, key, game_auto_launch_delay, deliver_password_play);
					},
					items: items
				};
			}
		});

		$('#' + that.menu_target_id).trigger('contextmenu');
	})

}

function rungame_show_dialog(game_id)
{
	theGames.forEach(function(obj) {
		if (game_id != obj.pkg_id)
			return;


		// Use Vue state
		vueRunGame.game_id = obj.pkg_id;
		vueRunGame.title = obj.pkg_name;
		vueGlobal.modals.runGame = true;
	})
}

function copy_game_license_show_dialog(account, password)
{
	vueGameLicense.account = account;
	vueGameLicense.password = password;
	vueGlobal.modals.gameLicense = true;
}

function rungame_switch_to()
{
	var game_id = vueRunGame.game_id;
	vueGlobal.modals.runGame = false;
	CallFunction("RUNGAME_SWITCH_TO " + game_id);
}

function rungame_terminate()
{
	var game_id = vueRunGame.game_id;
	vueGlobal.modals.runGame = false;
	CallFunction("RUNGAME_TERMINATE " + game_id);
}

function game_tracker()
{
	// game api
	if (typeof(theLocalParams) != 'undefined' && typeof(theLocalParams.beta) != 'undefined' && theLocalParams.beta == 1)
		CallFunction("GAMETRACKER " + thePCStatus.member_id + " " + thePCStatus.status_pc_token);
}