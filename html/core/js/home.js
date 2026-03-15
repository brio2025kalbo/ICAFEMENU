function Home()
{
	this.show = function(refreshBanance = false) {

		vueGlobal.pageType = "Home";
		vueGlobal.showBottom = true;
		
		theGameList.clear_game_info();
		
		setBodyStyle();
		
		// Check if member's birthday and birthday animation is set
		var birthdayAnimation = theSettings.birthday_animation ?? '';
		var isBirthday = is_member_birthday_today() && birthdayAnimation && birthdayAnimation.length > 0;
		
		if(isBirthday)
		{
			// Use birthday animation on member's birthday
			vueGlobal.backgroundImage = '';
			theVideo.play(ICAFEMENU_CORE.root_path(birthdayAnimation));
		}
		else if((theSettings.client_bg_format ?? 0) == 0)
		{
			vueGlobal.backgroundImage = `url('${ICAFEMENU_CORE.posters_path('cafe_info_cafe_background.jpg')}'), url('images/games.jpg')`;
			theVideo.hide();
		}
		else
		{
			vueGlobal.backgroundImage = '';
			theVideo.play(ICAFEMENU_CORE.root_path(theSettings.client_bg_video ?? ''));
		}

		vueGlobal.currentView = 'layout';
		vueGlobal.bodyClass = 'bd-game-page';

		// Top 5 Games - 有收藏显示收藏，没有收藏显示热门
		var topFiveGames = [];
		
		// 确保 member_favorite_games 已初始化（从 thePCStatus.member_recent_played 加载）
		if (typeof(thePCStatus.member_recent_played) != 'undefined' && thePCStatus.member_recent_played != null) {
			try {
				theGameList.member_favorite_games = JSON.parse(thePCStatus.member_recent_played);
			} catch(e) {
				theGameList.member_favorite_games = [];
			}
		}
		
		// 如果有收藏，只显示收藏的游戏（有几个显示几个，最多5个）
		if (theGameList.member_favorite_games && theGameList.member_favorite_games.length > 0) {
			theGameList.member_favorite_games.forEach(fav => {
				var game = theGames.find(g => g.pkg_id == fav.pkg_id);
				if (game && game.pkg_name.toLowerCase() !== 'icafemenu' && game.pkg_name.toLowerCase() !== 'overwolf') {
					topFiveGames.push(game);
				}
			});
		} else {
			// 没有收藏时，显示热门游戏
			theGames.sort(theGameList.local_hot_compare).forEach(game => {
				if (game.pkg_name.toLowerCase() === 'icafemenu' || game.pkg_name.toLowerCase() === 'overwolf') return;
				topFiveGames.push(game);
			});
		}
		topFiveGames = topFiveGames.slice(0, 5);
		vueGames.topFiveItems = JSON.parse(JSON.stringify(topFiveGames));

		// Promoted product
		theShop.change_group(PRODUCT_GROUP_PROMOTED);
		setDropdownMenu();

		if (is_member_logined())
			vueGlobal.menuButton.changepassword = true;

		// 用户积分
		if((thePCStatus.member_points ?? null) && (theSettings.point_enable ?? 0)) {
			theMemberGroup = theMemberGroup.filter(obj => obj.member_group_id > 0 && obj.member_group_point_min !== undefined)
			.sort((a, b) => parseFloat(a.member_group_point_min) - parseFloat(b.member_group_point_min));

			var memberGroup = [];
			var groupIndex = 1;
			var memberCurrentGroup = 0;
			var memberCurrentGroupPoint = 0;
			theMemberGroup.forEach(function(group) {

				let point_min = parseFloat(group.member_group_point_min);

				if(thePCStatus.member_group_id == group.member_group_id) {
					memberCurrentGroup = groupIndex;
					memberCurrentGroupPoint = (groupIndex == theMemberGroup.length ? point_min : theMemberGroup[groupIndex].member_group_point_min);
				}

				memberGroup.push(
					{
						mebmer_group_index: groupIndex,
						member_group_id: group.member_group_id,
						member_group_name: group.member_group_name,
						member_group_point_min: point_min,
					}
				);

				groupIndex++;
			});
			
			if(memberGroup.length > 0)
			{
				var lastGroupIndex = memberGroup[memberGroup.length - 1].mebmer_group_index;
				var showMemberGroup = [];
				if(memberCurrentGroup == 1 || memberCurrentGroup == 0) {
					showMemberGroup = memberGroup.slice(0, 3);
				} else if(lastGroupIndex == memberCurrentGroup) {
					let startIndex = memberGroup.length > 3 ? memberGroup.length - 3 : 0;
					showMemberGroup = memberGroup.slice(startIndex, memberGroup.length);
				} else {
					showMemberGroup = memberGroup.slice(memberCurrentGroup - 2, memberCurrentGroup + 1);
				}

				if(memberCurrentGroup == 0 && showMemberGroup.length > 0) {
					memberCurrentGroupPoint = showMemberGroup[0].member_group_point_min;
				}

				vueHome.memberCurrentGroup = memberCurrentGroup; 
				
				vueHome.memberGroup = JSON.parse(JSON.stringify(showMemberGroup));
				vueHome.memberCurrentGroupName = vueHome.memberGroup.findIndex(g=>g.mebmer_group_index == memberCurrentGroup)?.member_group_name
				vueHome.memberPointValue = thePCStatus.member_points + '/' + memberCurrentGroupPoint;
				let idx = vueHome.memberGroup.findIndex(g=>g.mebmer_group_index == memberCurrentGroup)
				if(idx > 0){
					vueHome.nextGroup =vueHome.memberGroup[idx+1]
				}
			}
		}

		PetiteVue.nextTick(() => {
			ui_init();
			$('[data-toggle="tooltip"]').tooltip();
			//that.load_games_by_class('class', 'Favorite', '');
		});
		
		if (typeof(theCafeNews) != 'undefined' && theCafeNews != null && theCafeNews.length > 0) {
			//$('#news_carousel_main .carousel-inner').html(tmpl('tmpl-news', { items: theCafeNews } ));
			//translate_obj($('#news_carousel_main .carousel-inner'));
			for(var i = 0; i < theCafeNews.length; i ++)
			{
				theCafeNews[i].active = '';
			}
			if(theCafeNews.length > 0)
				theCafeNews[0].active = 'active';
			vueCafeNews.items = JSON.parse(JSON.stringify(theCafeNews)).map((item) => {
				item.news_show_qr = typeof(item.news_show_qr) == 'undefined' ? true : item.news_show_qr;
				item.news_video = typeof(item.news_video) == 'undefined' ? '' : item.news_video;
				item.isYoutube = false;
				item.news_duration = typeof(item.news_duration) == 'undefined' ? 5000 : item.news_duration;
				item.news_type = typeof(item.news_type) == 'undefined' ? 'picture' : item.news_type;
				if (item.news_video.match(/youtube/) !== null){
					var videoSplit = item.news_video.split("?v=");
					var videoId = videoSplit ? videoSplit[1] : "";
					if(videoId.length > 0)
					{
						item.isYoutube = true;
						item.news_video = "https://www.youtube.com/embed/" + videoId + "?mute=1&modestbranding=1&autohide=1&showinfo=0&controls=0&autoplay=1&loop=1&playlist=" + videoId + "&version=3";
					}
				}
				else
					item.news_video = ICAFEMENU_CORE.root_path(item.news_video);
				
				if(item.news_type === 'picture') {
					item.news_video = ''
				}

				return item;
			});
			
			PetiteVue.nextTick(() => {
				var start = $('#home_carousel_news .carousel-inner').find('.active').attr('data-bs-interval');
				var t = setTimeout("$('#home_carousel_news').carousel({interval: 1000});", start-1000);
				$('#home_carousel_news').on('slid.bs.carousel', function () {
					clearTimeout(t); 
					var duration = $('#home_carousel_news .carousel-inner').find('.active').attr('data-bs-interval');
					 $('#home_carousel_news').carousel('pause');
					 t = setTimeout("$('#home_carousel_news').carousel({interval: 1000});", duration-1000);
				})

				$('#home_carousel_news .carousel-indicators').on('click', function(){
					clearTimeout(t); 
				});

				$('#home_carousel_news .carousel-indicators').on('click', function(){
					clearTimeout(t); 
				});
				ui_init();
				$('[data-toggle="tooltip"]').tooltip();
			});

			//$('#home_carousel_news').carousel({ interval: 1000 });
		}
		// 刷新余额
		if (refreshBanance) {
			refreshBalanceInfo();
		}
		theGameList.show(); //不显示首页了
	}
}

function open_news(id)
{
	theCafeNews.forEach(function(obj) {
		if (obj.news_id == id) {
			CallFunction('OPENURL ' + obj.news_url);
			console.log('open news ' + obj.news_url);
		}
	});
}

function handleQRClick(id) {
	vueCafeNews.items = vueCafeNews.items.map((item) => {
		if (item.news_id === id) {
			item.news_show_qr = false;
		}
		return item;
	});
}

async function refreshBalanceInfo(member_account = '') {
	const member_info = await theApiClient.callCafeApi('getRealTimeBalance', 'POST', {
		member_account: member_account.length > 0 ? member_account : thePCStatus.member_account,
		pc_name: thePCInfo.pc_name
	}).catch(ICafeApiError.skip)
	console.log('refresh balance info: member_account='+member_account+';thePCStatus.member_account='+thePCStatus?.member_account+';member_balance=' + member_info?.member_balance)
	if (!member_info)  return 
	var member_balance = member_info.member_balance ?? 0;
	memberInfo.member_balance_realtime = format_balance(member_balance);
	memberInfo.member_balance = member_balance;
	
	var member_balance_bonus = member_info.member_balance_bonus ?? 0;
	memberInfo.member_balance_bonus_realtime = format_balance(member_balance_bonus);
	memberInfo.member_balance_bonus = member_balance_bonus;
	
	var member_coin_balance = member_info.member_coin_balance ?? 0;
	memberInfo.member_coin_balance = format_balance(member_coin_balance);
	
	var member_loan = member_info.member_loan ?? 0;
	memberInfo.member_loan = format_balance(member_loan);
	
	var price_per_hour = member_info.price_per_hour ?? 0;
	memberInfo.price_per_hour = format_balance(price_per_hour);
	
	var pc_cost = member_info.pc_cost ?? 0;
	memberInfo.pc_cost = format_balance(pc_cost);
	
	setTimeout(() => {}, 0);
}

// Global functions refactored from game.htm inline scripts
function switchShopTab(tab) {
	// 使用Vue状态控制Tab激活和内容显示
	vueHome.currentShopTab = tab;
	
	// 加载对应数据
	if (tab === 'promoted') {
		if (typeof theShop !== 'undefined' && typeof theShop.change_group === 'function') {
			theShop.change_group(PRODUCT_GROUP_PROMOTED);
		}
	} else if (tab === 'offers') {
		if (typeof theShop !== 'undefined' && typeof theShop.change_group === 'function') {
			theShop.change_group(PRODUCT_GROUP_OFFERS);
		}
	}
	
	if (typeof vueHome !== 'undefined') {
		vueHome.promotedActive = 0;
		vueHome.offersActivePage = 0;
	}
}

function updateShopItems() {
	if (typeof vueHome !== 'undefined' && vueHome.$forceUpdate) vueHome.$forceUpdate();
}

function prevShopPage() {
	if (typeof vueHome === 'undefined' || !vueHome.promotedGoods || vueHome.promotedGoods.length <= 1) return;
	var pageSize = 3;
	var total = Math.ceil(vueHome.promotedGoods.length / pageSize);
	if (total <= 1) return;
	vueHome.promotedActive = (vueHome.promotedActive - 1 + total) % total;
}

function nextShopPage() {
	if (typeof vueHome === 'undefined' || !vueHome.promotedGoods || vueHome.promotedGoods.length <= 1) return;
	var pageSize = 3;
	var total = Math.ceil(vueHome.promotedGoods.length / pageSize);
	if (total <= 1) return;
	vueHome.promotedActive = (vueHome.promotedActive + 1) % total;
}

function prevOffersPage() {
	if (typeof vueHome === 'undefined') return;
	if (typeof vueProducts === 'undefined' || !vueProducts.items) return;
	var totalPages = Math.ceil(vueProducts.items.length / 3);
	if (totalPages <= 1) return;
	vueHome.offersActivePage = ((vueHome.offersActivePage || 0) - 1 + totalPages) % totalPages;
}

function nextOffersPage() {
	if (typeof vueHome === 'undefined') return;
	if (typeof vueProducts === 'undefined' || !vueProducts.items) return;
	var totalPages = Math.ceil(vueProducts.items.length / 3);
	if (totalPages <= 1) return;
	vueHome.offersActivePage = ((vueHome.offersActivePage || 0) + 1) % totalPages;
}

function switchRankNewsTab(tab) {
	// 使用Vue状态控制Tab激活和内容显示
	vueHome.currentRankNewsTab = tab;
}

function prevNewsPage() {
	if (typeof vueCafeNews === 'undefined' || !vueCafeNews.items || vueCafeNews.items.length <= 1) return;
	const totalPages = vueCafeNews.items.length;
	vueHome.newsActivePage = (vueHome.newsActivePage - 1 + totalPages) % totalPages;
	$('#game_carousel_news').carousel(vueHome.newsActivePage);
}

function nextNewsPage() {
	if (typeof vueCafeNews === 'undefined' || !vueCafeNews.items || vueCafeNews.items.length <= 1) return;
	const totalPages = vueCafeNews.items.length;
	vueHome.newsActivePage = (vueHome.newsActivePage + 1) % totalPages;
	$('#game_carousel_news').carousel(vueHome.newsActivePage);
}

function goToNewsPage(index) {
	vueHome.newsActivePage = index;
	$('#game_carousel_news').carousel(index);
}

// handleQRClick is already defined or can be overwritten safely if identical
// function handleQRClick(newsId) { if (typeof open_news === 'function') open_news(newsId); }

// 初始化 news carousel 事件监听 - moved from $(document).ready
function initNewsCarousel() {
	$('#game_carousel_news').on('slid.bs.carousel', function(e) {
		var index = $(e.relatedTarget).index();
		if(typeof vueHome !== 'undefined') {
			vueHome.newsActivePage = index;
		}
	});
}

// Call initNewsCarousel when appropriate, or in ui_init if possible.
// For now, ensuring it runs when home is shown.
$(document).ready(function() {
	initNewsCarousel();
});