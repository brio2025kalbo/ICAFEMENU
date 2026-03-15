
/**
 * 2025 08
 * icafememu core functions
 */
// window.CallFunction = window.CallFunction || function (cmd) { console.log("CallFunction: " + cmd); };

// member group id
const MEMBER_GROUP_DEFAULT = 0;
const MEMBER_GROUP_GUEST = -1;
const MEMBER_GROUP_PREPAID = -2;
const MEMBER_GROUP_POSTPAID = -3;
const MEMBER_GROUP_OFFER = -4;
const MEMBER_GROUP_FREE = -5;

// order payment method
const PAY_METHOD_PAY_LATER = -2;
const PAY_METHOD_CASH = 0;
const PAY_METHOD_BALANCE = 1;
const PAY_METHOD_CARD = 2;
const PAY_METHOD_COIN = 3;
const PAY_METHOD_QR =   4;
const PAY_METHOD_CASH_FOR_OFFER = 10;
const PAY_METHOD_BALANCE_FOR_OFFER = 11;
const PAY_METHOD_CARD_FOR_OFFER = 12;
const PAY_METHOD_COIN_FOR_OFFER = 13;
const PAY_METHOD_QR_FOR_OFFER   = 14;
const PAY_METHOD_CASH_FOR_PC_TIME = 20;
const PAY_METHOD_BALANCE_FOR_PC_TIME = 21;
const PAY_METHOD_CARD_FOR_PC_TIME = 22;
const PAY_METHOD_QR_FOR_PC_TIME = 23;
const PAY_METHOD_CASH_FOR_BOOKING = 30;
const PAY_METHOD_BALANCE_FOR_BOOKING = 31;
const PAY_METHOD_CARD_FOR_BOOKING = 32;

// order status
const ORDER_STATUS_PENDING = 1;
const ORDER_STATUS_DONE = 2;
const ORDER_STATUS_CANCEL = 3;
const ORDER_STATUS_IN_PROCESS = 4;
const ORDER_STATUS_PREPARING = 5;

const GAME_TYPE_NORMAL = 1;
const GAME_TYPE_EPIC = 2;
const GAME_TYPE_BATTLE = 3;
const GAME_TYPE_EA = 4;
const GAME_TYPE_STEAM = 5;
const GAME_TYPE_RIOT = 6;
const GAME_TYPE_ROCKSTAR = 7;
const GAME_TYPE_UPLAY = 8;
const GAME_TYPE_VKPLAY = 9;
const GAME_TYPE_WINAPP = 10;
const GAME_TYPE_LESTA = 11;
const GAME_TYPE_GAMELOOP = 12;
const GAME_TYPE_BATTLESTATE = 13;
// tax id
const PC_TIME_TAX_ID = 4;

const PC_CONSOLE_PC = 0;
const PC_CONSOLE_OTHER = 1;
const PC_CONSOLE_XBOX = 2;
const PC_CONSOLE_PS3 = 3;
const PC_CONSOLE_PS4 = 4;
const PC_CONSOLE_PS5 = 5;
const PC_CONSOLE_WII = 6;
const PC_CONSOLE_TABLE = 7;
const PC_CONSOLE_ASSISTANT = 8;

const GAME_TYPE_NAMES = ['None', 'Normal', 'Epic', 'Battle.net', 'EA', 'Steam', 'Riot', 'Rockstar', 'Uplay', 'VK Play', 'Windows App'];

const PRODUCT_ICAFEMENU = 0;
const PRODUCT_ICAFECLOUD = 1;
const PRODUCT_CCBOOTCLOUD = 2;
const PRODUCT_CCBOOTCLOUDX = 3;

const PRODUCT_GROUP_OFFERS = -1;
const PRODUCT_GROUP_COINS = -2;
const PRODUCT_GROUP_ALL = -3;
const PRODUCT_GROUP_PROMOTED = -4;

const THEME_ICAFEMENU = 'icafemenu';

const RESET_PASSWORD_DEFAULT = 0;
const RESET_PASSWORD_SMS = 1;
const RESET_PASSWORD_EMAIL = 2;


const ICAFEMENU_CORE = {
	_main_path:'',
	/**
	 * client root path
	 */
	root_path(path){
		// /html/
		let root = this._main_path
		// start url scheme like http:// or https:// or ftp:// or file:// or c:/ or d:/
		if(/^\w+:\/\//i.test(path)){
			return path;
		}
		// windows path like c:\ or d:\.
		if(/^\w:\\/i.test(path)){
			return path;
		}
		// network share path \\server\share or //server/share
		if(/^\\\\.+/.test(path) || /^\/\/\.+/.test(path)){
			return path;
		}
		// 去掉文件名，只保留路径
		return root + (path||"").replace(/^\//,'')
	},
	/**
	 * client posters path
	 * @param {*} path 
	 * @returns 
	 */
	posters_path(path){
		return this.root_path() + 'posters/' + (path||"").replace(/^\//,'')
	},
	/**
	 * client icons path
	 * @returns 
	 */
	icons_path(path){
		return this.root_path() + 'icons/' + (path||"").replace(/^\//,'')
	},
	/**
	 * client images path
	 * @returns 
	 */
	images_path(path){
		return this.root_path() + 'images/' + (path||"").replace(/^\//,'')
	},
	/**
	 * client core  path
	 * @returns 
	 */
	core_path(path){
		return this.root_path() + 'core/' + (path||"").replace(/^\//,'')
	},
	/**
	 * current theme main path
	 * @param {*} path 
	 * @returns 
	 */
	main_path(path){
		let theme =  theSettings.client_theme || 'icafemenu';
		return this._main_path +  `themes/${theme}/` + (path||"").replace(/^\//,'');
	},
	write_script(path){
		document.writeln(`<script src="${path}"></script>`);
	},
	/**
	 * sleep ms milliseconds
	 * @param {*} ms
	 */
	sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	},
	/**
	 * run function after delay ms
	 * @param {*} fn 
	 * @param {*} wait 
	 * @returns 
	 */
	debounce: function (fn, wait = 300) {
		let timeout;
		return function (...args) {
			clearTimeout(timeout);
			timeout = setTimeout(() => fn.apply(this, args), wait);
		};
	},
	/**
	 * throttle function: ensures fn is called at most once every wait ms
	 * @param {*} fn 
	 * @param {*} wait 
	 * @returns 
	 */
	throttle(fn, wait = 300) {
		let lastTime = 0;
		return function (...args) {
			const now = Date.now();
			if (now - lastTime >= wait) {
				lastTime = now;
				return fn.apply(this, args);
			}
		};
	},

	/**
	 * Format time in seconds to HH:MM:SS or D:HH:MM:SS
	 * @param {number} seconds 
	 * @returns 
	 */
	format_time(seconds) {
		var hours = parseInt(seconds / 3600);
		var mins = parseInt((seconds % 3600) / 60);
		var secs = seconds % 60;
		var days = parseInt(hours / 24);

		var message = hours.toString() + ":" + mins.zeroPad(10) + ":" + secs.zeroPad(10);
		if (days > 0) {
			hours = hours % 24;
			message = days.toString() + ":" + hours.zeroPad(10) + ":" + mins.zeroPad(10) + ":" + secs.zeroPad(10);
		}
		return message;
	},
	/**
	 * format datetime to "DD MMM YY HH:MM"
	 * @param {*} s 
	 * @returns 
	 */
	format_datetime(s) {
		var date = new Date(s);
		if (isNaN(date))
			return '';

		var d = date.getDate();
		var m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
		var y = date.getFullYear().toString().substr(2);

		var h = date.getHours();
		if (h < 10)
			h = '0' + h;
		var min = date.getMinutes();
		if (min < 10)
			min = '0' + min;

		return d + ' ' + m + ' ' + y + ' ' + h + ':' + min;
	},
	/**
	 * format balance
	 */
	format_balance(balance) {
		var balance_realtime = accounting.formatMoney(parseFloat(balance), '', 2, ' ', '.').replace('.00', '');
		if (balance > 1000000)
			balance_realtime = accounting.formatMoney(parseFloat(balance / 1000000.0), '', 2, ' ', '.').replace('.00', '') + "M";

		return balance_realtime;
	},
	/**
	 * sha256
	 * @param {any} ascii 
	 * @returns 
	 */
	sha256(ascii) {
		function rightRotate(value, amount) {
			return (value >>> amount) | (value << (32 - amount));
		};

		var mathPow = Math.pow;
		var maxWord = mathPow(2, 32);
		var lengthProperty = 'length'
		var i, j;
		var result = ''

		var words = [];
		var asciiBitLength = ascii[lengthProperty] * 8;

		var hash = sha256.h = sha256.h || [];
		var k = sha256.k = sha256.k || [];
		var primeCounter = k[lengthProperty];

		var isComposite = {};
		for (var candidate = 2; primeCounter < 64; candidate++) {
			if (!isComposite[candidate]) {
				for (i = 0; i < 313; i += candidate) {
					isComposite[i] = candidate;
				}
				hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
				k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
			}
		}

		ascii += '\x80'
		while (ascii[lengthProperty] % 64 - 56) ascii += '\x00'
		for (i = 0; i < ascii[lengthProperty]; i++) {
			j = ascii.charCodeAt(i);
			if (j >> 8) return;
			words[i >> 2] |= j << ((3 - i) % 4) * 8;
		}
		words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
		words[words[lengthProperty]] = (asciiBitLength)

		for (j = 0; j < words[lengthProperty];) {
			var w = words.slice(j, j += 16);
			var oldHash = hash;
			hash = hash.slice(0, 8);

			for (i = 0; i < 64; i++) {
				var i2 = i + j;
				var w15 = w[i - 15], w2 = w[i - 2];

				var a = hash[0], e = hash[4];
				var temp1 = hash[7]
					+ (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
					+ ((e & hash[5]) ^ ((~e) & hash[6]))
					+ k[i]
					+ (w[i] = (i < 16) ? w[i] : (
						w[i - 16]
						+ (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
						+ w[i - 7]
						+ (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
					) | 0
					);
				var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
					+ ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

				hash = [(temp1 + temp2) | 0].concat(hash);
				hash[4] = (hash[4] + temp1) | 0;
			}

			for (i = 0; i < 8; i++) {
				hash[i] = (hash[i] + oldHash[i]) | 0;
			}
		}

		for (i = 0; i < 8; i++) {
			for (j = 3; j + 1; j--) {
				var b = (hash[i] >> (j * 8)) & 255;
				result += ((b < 16) ? 0 : '') + b.toString(16);
			}
		}
		return result;
	},
	/**
	 * htmlToText
	 * @param {string} html 
	 * @returns 
	 */
	htmlToText(html) {
		const div = document.createElement('div');
		div.textContent = html; // 自动转义 HTML 标签
		return div.innerHTML; // 返回转义后的文本
	},
	callFun(cmd, paramString = "") {
		const data = `${cmd} ${paramString}`.trim();
		// console.log(`CallFunction: ${data}`);
		CallFunction(data);
	},
};

Object.assign(ICAFEMENU_CORE, {
	countdown: { start() { throw new Event("Not impl") }, stop() { throw new Event("Not impl") } },

	/**
	 * lock window
	 */
	unlock_all() {
		ICAFEMENU_CORE.callFun("UNLOCK 65535");
		ICAFEMENU_CORE.callFun("DISABLEBSOD");
	},
	lastWindowSize: "",
	/**
	 * minimize window
	 */
	resizeWin(size) {
		ICAFEMENU_CORE.callFun("SETWINDOWSIZE " + size);
		ICAFEMENU_CORE.lastWindowSize = size
		// 临时兼容 theLastWindowSize
		theLastWindowSize = size
	},
	/**
	 * minisize window
	 */
	minisize() {
		ICAFEMENU_CORE.resizeWin("-2*-2")
		ICAFEMENU_CORE.callFun("HIDEWINDOW");
	},
	shutdown() {
		ICAFEMENU_CORE.callFun('SHUTDOWN ONLY');
	}
	, reboot() {
		ICAFEMENU_CORE.callFun('SHUTDOWN REBOOT');
	},
	run_protect(protection_settings) {
		if (protection_settings == null) {
			ICAFEMENU_CORE.callFun('RUNSCRIPT "{tools}\\protection\\cmd\\allow.bat"');
			ICAFEMENU_CORE.callFun('RUNSCRIPT "{tools}\\protection\\control_panel\\allow.bat"');
			CallFunction('RUNSCRIPT "{tools}\\protection\\download_file\\allow.bat"');
			ICAFEMENU_CORE.callFun('RUNSCRIPT "{tools}\\protection\\power_button\\allow.bat"');
			//CallFunction('RUNSCRIPT "{tools}\\protection\\regedit\\allow.bat"');
			ICAFEMENU_CORE.callFun('RUNSCRIPT "{tools}\\protection\\usb\\allow.bat"');
			ICAFEMENU_CORE.callFun('RUNSCRIPT "{tools}\\protection\\task_manager\\allow.bat"');
			return;
		}

		protection = JSON.parse(protection_settings);

		ICAFEMENU_CORE.callFun('RUNSCRIPT "{tools}\\protection\\cmd\\' + (protection.cmd ? 'deny.bat"' : 'allow.bat"'));
		ICAFEMENU_CORE.callFun('RUNSCRIPT "{tools}\\protection\\control_panel\\' + (protection.control_panel ? 'deny.bat"' : 'allow.bat"'));
		ICAFEMENU_CORE.callFun('RUNSCRIPT "{tools}\\protection\\download_file\\' + (protection.download_file ? 'deny.bat"' : 'allow.bat"'));
		ICAFEMENU_CORE.callFun('RUNSCRIPT "{tools}\\protection\\power_button\\' + (protection.power_button ? 'deny.bat"' : 'allow.bat"'));
		//ICAFEMENU_CORE.callFun('RUNSCRIPT "{tools}\\protection\\regedit\\' + (protection.regedit ? 'deny.bat"' : 'allow.bat"'));
		ICAFEMENU_CORE.callFun('RUNSCRIPT "{tools}\\protection\\usb\\' + (protection.usb ? 'deny.bat"' : 'allow.bat"'));
		ICAFEMENU_CORE.callFun('RUNSCRIPT "{tools}\\protection\\task_manager\\' + (protection.task_manager ? 'deny.bat"' : 'allow.bat"'));
	},
	unlock_pc() {
		if (theSettings.license_show_client_mode == 'full screen') {
			ICAFEMENU_CORE.resizeWin("-3*-3")
			ICAFEMENU_CORE.callFun("SETWINDOWTOPMOST 0");
		}

		if (typeof (theSettings.license_show_client_mode) == 'undefined' || theSettings.license_show_client_mode == 'maximized') {
			ICAFEMENU_CORE.resizeWin("-2*-2");
		}

		if (theSettings.license_show_client_mode == 'minimized') {
			ICAFEMENU_CORE.callFun("SETWINDOWSIZE -2*-2");
			ICAFEMENU_CORE.resizeWin("-2*-2")
			ICAFEMENU_CORE.callFun("HIDEWINDOW");
		}

		/*
			TASKMGR  = 0x01,	// disable task manager (Ctrl+Alt+Del)
			TASKKEYS = 0x02,	// disable task keys (Alt-TAB, etc)
			TASKBAR  = 0x04,	// disable task bar
			LOGOFF   = 0x08,	// disable task bar
			WINKEYS	 = 0x10,	// disable windows keys
		*/
		ICAFEMENU_CORE.callFun("UNLOCK 3"); // unlock alt+tab after login, user want to switch in game
		if (theSettings.license_show_client_mode != 'full screen')
			ICAFEMENU_CORE.callFun("UNLOCK 4"); // only enable taskbar
	},
	/**
	 * 
	 * @param {string} url 
	 */
	open_url(url) {
		ICAFEMENU_CORE.callFun('RUN ' + url);
		// console.log('open url ' + url);
	},
	/**
	 * send wss command
	 * @param {*} cmd 
	 */
	wsssend(action, type, target, data, from = 'client', version = 2) {
		let cmd = { action, type, target, data, from, version }
		ICAFEMENU_CORE.callFun('WSSSEND ' + JSON.stringify(cmd));
	},
	/**
	 * send assist request to wss server, at most once every 5 minutes
	 */
	send_assist: ICAFEMENU_CORE.throttle((pc_name) => {
		ICAFEMENU_CORE.wsssend('remind', 'request', 'web', {
			pc: pc_name,
			level: 'error',
			timeout: 0,
			message: 'assist'
		});
	}, 1000 * 300),

	/**
	 * get game name by game_stats_type
	 * @param {*} game_stats_type 
	 * @returns 
	 */
	getGameName(game_stats_type) {
		const gameMapping = {
			'fortnite-match-stats': 'Fortnite',
			'lol-match-stats': 'League of Legends',
			'valorant-match-stats': 'Valorant',
			'dota2-match-stats': 'Dota 2',
			'csgo-match-stats': 'CS:GO',
			'apex-match-stats': 'Apex Legends',
			"pubg-match-stats": "PUBG"
		};
		return gameMapping[game_stats_type] || '';
	},

	/**
	 * 获取所有支持的游戏配置
	 * 返回数组，每个元素包含 key, name, matchStatsType, rankOptionKey
	 */
	getSupportedGames() {
		return [
			{ key: 'fortnite', name: 'Fortnite', matchStatsType: 'fortnite-match-stats', rankOptionKey: 'game_rank_options_fortnite' },
			{ key: 'pubg', name: 'PUBG', matchStatsType: 'pubg-match-stats', rankOptionKey: 'game_rank_options_pubg' },
			{ key: 'dota2', name: 'Dota 2', matchStatsType: 'dota2-match-stats', rankOptionKey: 'game_rank_options_dota2' },
			{ key: 'csgo', name: 'CS:GO', matchStatsType: 'csgo-match-stats', rankOptionKey: 'game_rank_options_csgo' },
			{ key: 'valorant', name: 'Valorant', matchStatsType: 'valorant-match-stats', rankOptionKey: 'game_rank_options_valorant' },
			{ key: 'lol', name: 'League of Legends', matchStatsType: 'lol-match-stats', rankOptionKey: 'game_rank_options_lol' },
			{ key: 'apex', name: 'Apex Legends', matchStatsType: 'apex-match-stats', rankOptionKey: 'game_rank_options_apex' },
			{ key: 'custom', name: 'Custom', matchStatsType: 'custom-match-stats', rankOptionKey: 'game_rank_options_custom' }
		];
	}

	/**
	 * 获取已启用的游戏（根据theSettings中的game_rank_options_xx）
	 */
	, getEnabledGames() {
		return this.getSupportedGames().filter(game => {
			// 如果 theSettings[game.rankOptionKey] 明确为 0，则过滤掉，否则视为启用
			return theSettings[game.rankOptionKey] !== 0;
		});
	}

	/**
	 * 根据 matchStatsType 获取游戏名
	 */
	, getGameNameByMatchStatsType(type) {
		const game = this.getSupportedGames().find(g => g.matchStatsType === type);
		return game ? game.name : '';
	}

	/**
	 * 获取 gamecode2names 数组（用于 events）
	 */
	, getGameCode2Names() {
		// 所有的支持游戏
		const arr = this.getSupportedGames().map(g => ({ code: g.key, name: g.name }));
		// 只包含已启用的游戏
		const enabledGames = this.getEnabledGames();
		arr.push({ code: 'all', name: enabledGames.map(g => g.name).join(', ') });
		return arr;
	}
	, getMemberInfo() {
		const clientMemberInfo = JSON.parse(localStorage.getItem('clientMemberInfo'));
		if (!clientMemberInfo) {
			// show_login_by_no_token();
			return {};
		}

		return clientMemberInfo;
	},
	ui_init() { throw new Error('Not impl ui_init') },
	translate_string(eng) {
		eng = eng.toString();

		if (eng.length == 0)
			return '';

		var eng_lower = eng.toLowerCase();

		if (typeof (theLangStrings) != 'undefined' && typeof (theLangStrings[eng_lower]) != 'undefined')
			return theLangStrings[eng_lower];

		return eng;
	},

	// translate all childs with lang class for DOM => translate_obj($('body')),  translate_obj($('#member-table'))
	translate_obj(element) {
		if (typeof (element) !== 'object'){
			return '';
		}
		if( element.forEach ){
			return element.forEach(el=>this.translate_obj(el))
		}
		// 兼容jq
		if( element.each ){
			return element.each((i,el)=>this.translate_obj(el))
		}
		element.querySelectorAll('.lang').forEach(function (obj) {
			if (obj.children.length == 0) {
				var eng = obj.innerHTML.trim();
				var trans = this.translate_string(eng);
				if (trans.length > 0 && eng != trans) {
					obj.innerText = trans; // 避免vue render 的时候与vue变量冲突
				}
			}
			if (obj.title) {
				var eng = obj.title.trim();
				var trans = this.translate_string(eng);
				if (trans?.length > 0 && trans != eng) {
					obj.title = trans
				}
			}
			if (obj.placeholder) {
				var eng = obj.placeholder.trim();
				var trans = this.translate_string(eng);
				if (trans?.length > 0 && trans != eng) {
					obj.placeholder = trans
				}
			}
			if (obj.type == 'button' || obj.type == 'submit') {
				var eng = obj.value.trim();
				var trans = this.translate_string(eng);
				if (trans?.length > 0 && trans != eng) {
					obj.value = trans
				}
			}
		})

	},

	/**
	 * system info
	 * @param {*} event 
	 * @param {*} callback 
	 */
	onCmd(event, callback) {
		if(event == "*"){
			event = "_cmd_*"
		}
		window.addEventListener(event, function (e) {
			callback(e.detail.strParam,e.detail.strCmd);
		});
		return this;
	},
	onCmdOnce(event, callback) {
		window.addEventListener(event, function handler(e) {
			window.removeEventListener(event, handler);
			callback(e.detail.strParam,e.detail.strCmd);
		});
		return this;
	},
	/**
	 * wss action listener
	 * 多个事件逗号隔开
	 * @param {*} action[.type][,action[.type]] 
	 * @param {*} callback(packet)
	 * @returns 
	 */
	onWss: (() => {
		window.addEventListener('WSS_COMMAND', function (e) {
			const packet = JSON.parse(e.detail.strParam);
			if (typeof (packet.action) == 'undefined' || typeof (packet.version) == 'undefined' || typeof (packet.type) == 'undefined' || typeof (packet.data) == 'undefined' || typeof (packet.from) == 'undefined' || typeof (packet.target) == 'undefined') {
				return;
			}
			if (packet.version != 2 || packet.target != 'client') {
				return;
			}
			if (packet.action === 'client_status' && packet.data?.client_status) {
				['member_balance_realtime', 'member_balance_bonus_left_seconds'].forEach(function(k) {
					if (packet.data.client_status[k] != null) packet.data.client_status[k] = Number(packet.data.client_status[k]) || 0;
				});
			}
			// console.log(`WSS Command: ${packet.action}`, JSON.stringify(packet ?? []));
			window.dispatchEvent(new CustomEvent(`_wss_${packet.action}`, { detail: packet }));
			window.dispatchEvent(new CustomEvent(`_wss_${packet.action}.${packet.type}`, { detail: packet }));
			window.dispatchEvent(new CustomEvent(`_wss_*`, { detail: packet }));
		});
		return function (action_event, callback) {
			if (!action_event) return this;
			action_event.split(',').forEach(action_type => {
				window.addEventListener(`_wss_${action_type}`, function (e) {
					callback(e.detail);
				});
			})
			return this;
		}
	})(),
	/**
	 * listen to wss action once
	 * @param {*} action 
	 * @param {*} callback 
	 * @returns 
	 */
	onWssOnce(action, callback) {
		window.addEventListener(`_wss_${action}`, function handler(e) {
			window.removeEventListener(`_wss_${action}`, handler);
			callback(e.detail);
		});
		return this;
	},
	/**
	 * load core style
	 * @param {*} doc 
	 */
	loadCoreStyle(doc){
		doc.write([
					ICAFEMENU_CORE.core_path('lib/toastr/toastr.css'),
					ICAFEMENU_CORE.core_path('lib/sweetalert/sweetalert.css'),
					ICAFEMENU_CORE.core_path('lib/contextmenu/jquery.contextMenu.css'),
					ICAFEMENU_CORE.core_path('css/bootstrap.css'),
					ICAFEMENU_CORE.core_path('css/responsive.css'),
					ICAFEMENU_CORE.core_path('css/dark.css'),
					ICAFEMENU_CORE.core_path('css/font-awesome.css'),
					ICAFEMENU_CORE.core_path('css/freakflags/freakflags.css'),
					
				].map(src => `<link rel="stylesheet" type="text/css" href="${src}">`).join(''))
	},
	/**
	 * load core script
	 * @param {*} doc 
	 */
	loadCoreScript(doc){
		doc.write([
			ICAFEMENU_CORE.root_path('js/icafe.js'),
			ICAFEMENU_CORE.core_path('apiclient.js'),
			ICAFEMENU_CORE.core_path('lib/jquery.js'),
			ICAFEMENU_CORE.core_path('lib/petite-vue.iife.js'),
			ICAFEMENU_CORE.core_path('lib/accounting.js'),
			ICAFEMENU_CORE.core_path('lib/md5.js'),
			ICAFEMENU_CORE.core_path('lib/moment.js'),
			ICAFEMENU_CORE.core_path('lib/qrcode.js'),
			ICAFEMENU_CORE.core_path('lib/bootstrap.js'),
			ICAFEMENU_CORE.core_path('lib/toastr/toastr.js'),
			ICAFEMENU_CORE.core_path('lib/sweetalert/sweetalert.js'),
			ICAFEMENU_CORE.core_path('lib/templates/tmpl.js'),
			ICAFEMENU_CORE.core_path('lib/contextmenu/jquery.contextMenu.js'),
			ICAFEMENU_CORE.core_path('lib/clipboard/clipboard.js'),

			ICAFEMENU_CORE.core_path("js/helper.js"),
			ICAFEMENU_CORE.core_path("js/login.js"),
			ICAFEMENU_CORE.core_path("js/layout.js"),
			ICAFEMENU_CORE.core_path("js/home.js"),
			ICAFEMENU_CORE.core_path("js/game.js"),
			ICAFEMENU_CORE.core_path("js/shop.js"),
			ICAFEMENU_CORE.core_path("js/event.js"),
			ICAFEMENU_CORE.core_path("js/rank.js"),
			ICAFEMENU_CORE.core_path("js/system.js"),
			ICAFEMENU_CORE.core_path("js/listen.js"),
			ICAFEMENU_CORE.core_path("js/main.js"),
		].map(src => `<script src="${src}" ></script>`).join(''))
	}

})

const OnCommand = function (strCmd, strParam,source='exe') {
	strParam = strParam?.replace(/____@@@____/g, '\\') || ''
	strParam = strParam.replace(/____@@____/g, '"')
	strParam = strParam.replace(/____@____/g, '\'')
	strParam = strParam.replace(/___@@@@___/g, '\r')
	strParam = strParam.replace(/___@@@@@___/g, '\n')
	//console.debug("OnCommand",source,strCmd,strParam)
	window.dispatchEvent(new CustomEvent(strCmd, { detail: {strCmd,strParam} }));
	window.dispatchEvent(new CustomEvent(`_cmd_*`, { detail:  {strCmd,strParam} }));
}

// todo: 迁移兼容 OnCommand
window.addEventListener('load', () => {
	let param = new URLSearchParams(location.search);
	if (!param.get('OnCommand')) {
		return
	}
	let list = JSON.parse(param.get('OnCommand')) || [];
	list.forEach(({ strCmd, strParam }) => {
		OnCommand(strCmd, strParam,'query');
	})
})
// /html/main.htm => /html/
ICAFEMENU_CORE._main_path = location.pathname.replace(/\/[^\/]+$/,'/')
Object.freeze(ICAFEMENU_CORE);
console.debug('ICAFEMENU_CORE initialized', ICAFEMENU_CORE);

// window.addEventListener('error',e=>alert(`Error: ${e.message}\n${e.filename}:${e.lineno}:${e.colno}`));