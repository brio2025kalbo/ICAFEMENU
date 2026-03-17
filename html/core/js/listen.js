// -- CLIENT start --
// 1. client wss connected
// 2. client send login package to server
// 2. server send login + settings package to client (assign to theSettings)
// 3. server send client_status package to client (assign to thePCStatus)

// -- CLIENT login --
// 1. client send member_login package to server
// 2. server send client_status package to client

// -- TIME over --
// 1. client send auto_checkout package to server (countdown())
// 2. server send client_status package to client

// -- click CHECKOUT --
// 1. client send request_checkout package to server
// 2. server send client_status package to client

// -- session start/checkout, add time, add offer, topup member, add order using balance on CP --
// 1. server send client_status package to client
ICAFEMENU_CORE.onWss('member_register', packet => {
	if (theSettings.license_using_billing == 0)
		return;
	vueGlobal.isLoading = false;
	// Button disabled state handled by vueGlobal.isLoading binding in template

	if (packet.status == 'error') {
		sweetAlert("", translate_string(packet.data.message), "error");
		return;
	}
	sweetAlert("", translate_string("Succeed"), "success");

	vueGlobal.modals.registerMember = false;
	return;
}).onWss('admin_message', ({ data }) => {
	toastr.options.tapToDismiss = true;
	toastr.options.timeOut = 0;
	toastr.options.extendedTimeOut = 0;
	toastr.info(htmlToText(data.message), translate_string('Message from ') + data.from, {
		toastClass: "custom-transparent-toast"
	});
	var license_lang = theSettings.license_lang ?? '';
	var supportedLangs = ['ar', 'es', 'mn', 'ru', 'tr_TR'];
	license_lang = supportedLangs.includes(license_lang) ? (license_lang + "/") : '';
	ICAFEMENU_CORE.callFun("PLAYSOUND customized/admin-message.wav " + license_lang + "admin-message.wav");
	return;
}).onWss('quit,exit', () => {
	ICAFEMENU_CORE.unlock_all();
	ICAFEMENU_CORE.callFun("EXIT");
}).onWss('shutdown', () => {
	ICAFEMENU_CORE.unlock_all();
	ICAFEMENU_CORE.callFun("SHUTDOWN ONLY");
}).onWss('reboot', () => {
	ICAFEMENU_CORE.unlock_all();
	ICAFEMENU_CORE.callFun("SHUTDOWN REBOOT");
}).onWss('logoff', () => {
	ICAFEMENU_CORE.unlock_all();
	ICAFEMENU_CORE.callFun("SHUTDOWN REBOOT");
}).onWss('payment_qr', ({ data }) => {
	sweetAlert("", translate_string(data.message), "info");
	if (data.member_group_id == MEMBER_GROUP_PREPAID) {
		vueGlobal.modals.topupLogin = false;
	} else {
		vueGlobal.modals.shopTopup = false;
	}
}).onWss('member_login.response', packet => {
	if (packet.status == 'error') {
		show_login_page('login');
		sweetAlert("", translate_string(packet.data?.message), "error");
	}
}).onWss('member_change_password.response', () => {
	//TODO useless and remove
	sweetAlert(translate_string("Succeed"), translate_string("The password was changed successfully."), "success");
	vueGlobal.modals.changePassword = false;
}).onWss('login.response', () => {
	theSettings.login_count = theSettings.login_count || 0;
	theSettings.login_count++
	if (theSettings.login_count > 1) {
		return
	}
	vueGlobal.currency = typeof (theSettings.currency) == 'undefined' ? '$' : theSettings.currency;
	vueGlobal.showOffersDiv = false;
	if (theSettings.license_using_billing == 0) {
		vueGlobal.menuButton.logout = false;
		vueGlobal.menuButton.feedback = false;
		vueGlobal.menuButton.assist = false;
		vueGlobal.menuButton.changepassword = false;
	}
	if (theSettings.license_using_billing == 1) {
		vueGlobal.menuButton.logout = true;
		vueGlobal.menuButton.feedback = true;
		vueGlobal.menuButton.assist = true;
	}
	if (!theIsHomeVersion && theSettings.license_using_billing == 1)
		vueGlobal.showOffersDiv = true;

	// first connect, set timeout for idle shutdown (don't move below codes to any where)
	if (!theIsHomeVersion && !theApiClient.isLogined() && theSettings.client_idle_mins > 0) {
		if (theIdleMonitorTimerId != null) {
			clearTimeout(theIdleMonitorTimerId);
			theIdleMonitorTimerId = null;
		}
		theIdleMonitorTimerId = setTimeout(function () {
			if (['run_checkout', 'run'].includes(theSettings.client_idle_action.toLowerCase())) {
				ICAFEMENU_CORE.callFun('RUN run.bat');
			}

			if (['shutdown_checkout', 'shutdown'].includes(theSettings.client_idle_action.toLowerCase())) {
				ICAFEMENU_CORE.unlock_all();
				ICAFEMENU_CORE.callFun("SHUTDOWN ONLY FAST");
			}
		}, theSettings.client_idle_mins * 1000 * 60);
	}
}).onWss('submit_order.response', ({ data }) => {
	toast(translate_string('Your order submitted'));
	if (data.pay_method == 3) {
		theShop.gift_cart_clear();
		return;
	}
	theShop.cart_clear();
}).onWss('client_status', packet => {
	wss_client_status(packet)
}).onWss('*', (packet) => {
	if (packet.status != 'error') return;
	if (packet.action == 'member_login') return;
	sweetAlert("", translate_string(packet.data?.message), "error");
})

async function requestApiToken() {
	if (!thePCStatus.status_pc_token) {
		return null;
	}
	let toknInfo = await theApiClient.memberLogin(thePCStatus.member_account, thePCStatus.status_pc_token, null, theCafe.license_name, thePCInfo.pc_name)
		.catch(ICafeApiError.skip)
	if (toknInfo?.token) {
		vueGlobal.showOrderList = true;
		return toknInfo?.token
	}
	return null;
}

async function wss_client_status(packet) {
	let data = packet.data
	vueGlobal.isLoading = false;
	// if disable billing, auto login
	if (theSettings.license_using_billing == 0 && !theClientStatusInitialized) {
		theClientStatusInitialized = true;
		guest_login();
		return;
	}

	var last_login_status = is_logined();
	var member_loan = 0;
	if (last_login_status && thePCStatus.member_loan > 0)
		member_loan = thePCStatus.member_loan;

	countdown_stop();
	thePCStatus = data.client_status;
	theApiClient.setServerCode(thePCStatus.license_server_code);

	console.log("Current state is " + (is_logined() ? 'logined' : 'logout'));
	console.log("Previous state is " + (last_login_status ? 'logined' : 'logout'));

	var d = new Date();
	thePCStatus.login_time = parseInt((d.getTime() + d.getTimezoneOffset() * 60 * 1000) / 1000);  // UTC time
	if (thePCStatus.member_group_name == null) {
		if (thePCStatus.member_group_id == MEMBER_GROUP_DEFAULT) {
			thePCStatus.member_group_desc = thePCStatus.member_group_name = translate_string('Default');
		}

		if (thePCStatus.member_group_id == MEMBER_GROUP_GUEST) {
			thePCStatus.member_group_desc = thePCStatus.member_group_name = translate_string('Guest');
		}

		if (thePCStatus.member_group_id == MEMBER_GROUP_PREPAID) {
			thePCStatus.member_group_desc = thePCStatus.member_group_name = translate_string('Prepaid');
		}

		if (thePCStatus.member_group_id == MEMBER_GROUP_POSTPAID) {
			thePCStatus.member_group_desc = thePCStatus.member_group_name = translate_string('Postpaid');
		}

		if (thePCStatus.member_group_id == MEMBER_GROUP_FREE) {
			thePCStatus.member_group_desc = thePCStatus.member_group_name = translate_string('Free');
		}

		if (thePCStatus.member_group_id == MEMBER_GROUP_OFFER) {
			thePCStatus.member_group_desc = thePCStatus.member_group_name = translate_string('Offer');
		}
	}

	if (thePCStatus.status_connect_time_left && thePCStatus.status_connect_time_left.length > 0) {
		// if time left < 00:00:00
		if (thePCStatus.status_connect_time_left.charAt(0) == '-') {
			thePCStatus.status_connect_time_left = -1;
		}
		else {
			var items = thePCStatus.status_connect_time_left.split(':');
			if (items.length == 0)
				thePCStatus.status_connect_time_left = 0;
			// parseInt("08") and parseInt("09") in wke return 0, must use parseInt("08", 10)
			if (items.length == 1)
				thePCStatus.status_connect_time_left = parseInt(items[0], 10);
			if (items.length == 2)
				thePCStatus.status_connect_time_left = parseInt(items[0], 10) * 60 + parseInt(items[1], 10);
			if (items.length == 3)
				thePCStatus.status_connect_time_left = parseInt(items[0], 10) * 60 * 60 + parseInt(items[1], 10) * 60 + parseInt(items[2], 10);
		}
	}

	// postpaid show time used
	if (thePCStatus.status_connect_time_duration && thePCStatus.status_connect_time_duration.length > 0) {
		// if time left < 00:00:00
		var items = thePCStatus.status_connect_time_duration.split(':');
		if (items.length == 0)
			thePCStatus.status_connect_time_duration = 0;
		// parseInt("08") and parseInt("09") in wke return 0, must use parseInt("08", 10)
		if (items.length == 1)
			thePCStatus.status_connect_time_duration = parseInt(items[0], 10);
		if (items.length == 2)
			thePCStatus.status_connect_time_duration = parseInt(items[0], 10) * 60 + parseInt(items[1], 10);
		if (items.length == 3)
			thePCStatus.status_connect_time_duration = parseInt(items[0], 10) * 60 * 60 + parseInt(items[1], 10) * 60 + parseInt(items[2], 10);
	}

	// in login page
	if (!is_logined()) {
		stop_game_timers();
		if(theSettings.allow_client_print ?? 0)
		{
			ICAFEMENU_CORE.callFun("STOP_PRINT_WATCH");
		}

		if (last_login_status) // after checkout
		{
			ICAFEMENU_CORE.callFun('RUN logout.bat');

			// game api
			// game_tracker();

			show_login_page('login');
			theEvents.reset();
			
			// Reset member photo to ensure Free Session shows default avatar
			memberInfo.member_photo = null;

			if (theIsHomeVersion)
				return;

			// switch to icafemenu
			ICAFEMENU_CORE.callFun("RUNGAME_SWITCH_TO 0");

			if (member_loan > 0) {
				sweetAlert("", translate_string('Your unpaid bill is {0} {1}. Please pay it at the front desk.').replace('{0}', member_loan).replace('{1}', theSettings.currency), "info");
			}

			var client_idle_mins = (typeof (theSettings.client_idle_mins) != 'undefined' ? theSettings.client_idle_mins : 0);
			if (client_idle_mins > 0) {
				// action after idle time
				if (theIdleMonitorTimerId != null) {
					clearTimeout(theIdleMonitorTimerId);
					theIdleMonitorTimerId = null;
				}
				console.log('Will ' + theSettings.client_idle_action + ' after idle ' + client_idle_mins + ' minutes');
				theIdleMonitorTimerId = setTimeout(function () {

					if (['run_checkout', 'run'].includes(theSettings.client_idle_action.toLowerCase())) {
						console.log('RUN run.bat');
						ICAFEMENU_CORE.callFun('RUN run.bat');
					}

					if (['shutdown_checkout', 'shutdown'].includes(theSettings.client_idle_action.toLowerCase())) {
						unlock_all();
						console.log('Shutdown');
						ICAFEMENU_CORE.callFun("SHUTDOWN ONLY FAST");
					}

					if (theSettings.client_idle_action.toLowerCase() == 'reboot') {
						unlock_all();
						console.log('Reboot');
						ICAFEMENU_CORE.callFun("SHUTDOWN REBOOT FAST");
					}

					if (theSettings.client_idle_action.toLowerCase() == 'logoff') {
						unlock_all();
						console.log('Logoff');
						ICAFEMENU_CORE.callFun("SHUTDOWN LOGOFF");
					}

					if (theSettings.client_idle_action.toLowerCase() == 'close all apps') {
						// kill all apps
						console.log('Close all apps');
						ICAFEMENU_CORE.callFun("RUNGAME_TERMINATE 0");
					}

				}, client_idle_mins * 1000 * 60);
			}

			var pc_mining_enabled = (typeof (thePCStatus.pc_mining_enabled) != 'undefined' ? thePCStatus.pc_mining_enabled : 0);
			if (pc_mining_enabled === 1) {
				var client_mining_idle_mins = typeof (theSettings.client_mining_idle_mins) != 'undefined' ? theSettings.client_mining_idle_mins : 5;
				console.log("Will start miner after " + client_mining_idle_mins + " minutes");
				theIdleMiningTimerId = setTimeout(function () {
					var pc_mining_tool = (typeof (thePCStatus.pc_mining_tool) != 'undefined' ? thePCStatus.pc_mining_tool : 'nicehash');
					var pc_mining_options = (typeof (thePCStatus.pc_mining_options) != 'undefined' ? thePCStatus.pc_mining_options : '');
					ICAFEMENU_CORE.callFun("MINER_START " + pc_mining_tool + " " + pc_mining_options);
				}, client_mining_idle_mins * 1000 * 60);
			}

			return;
		}

		if (theIsHomeVersion) // home version don't mining in login page
			return;

		// normal login page

		// show booking info
		if (typeof (thePCStatus.recent_booking) != 'undefined' && thePCStatus.recent_booking != null) {
			toast(translate_string("Recent booking") + ": " + thePCStatus.recent_booking, 'warning');
			// 同步到登录页顶部展示
			if (typeof vueLogin !== 'undefined') {
				// 03-04 23:30, 取23:30
				var rawBooking = thePCStatus.recent_booking;
				var bookingTime = rawBooking.split(' ')[1];

				vueLogin.recentBookingAt = bookingTime;
				// 根据bookingTime计算距离现在时间的剩余时间 格式: 3 hours 17 minutes 18 seconds
				var now = new Date();
				var bookingDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), bookingTime.split(':')[0], bookingTime.split(':')[1]);
				var remainingTime = bookingDate.getTime() - now.getTime();
				if( remainingTime < 0 ){
					remainingTime = remainingTime + 24 * 3600 * 1000
				}
				var hours = Math.floor(remainingTime / (1000 * 60 * 60));
				var minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
				var seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
				var bookingLeft = hours + ' hours ' + minutes + ' minutes ' + seconds + ' seconds';
				vueLogin.recentBookingLeft = bookingLeft;
			}
		} else if (typeof vueLogin !== 'undefined') {
			// 没有预定时清空提示
			vueLogin.recentBookingAt = '';
			vueLogin.recentBookingLeft = '';
		}

		var pc_mining_enabled = (typeof (thePCStatus.pc_mining_enabled) != 'undefined' ? thePCStatus.pc_mining_enabled : 0);
		if (pc_mining_enabled == 1 && theIdleMiningTimerId == null) {
			var client_mining_idle_mins = typeof (theSettings.client_mining_idle_mins) != 'undefined' ? theSettings.client_mining_idle_mins : 5;
			console.log("Will start miner after " + client_mining_idle_mins + " minutes");
			theIdleMiningTimerId = setTimeout(function () {
				var pc_mining_tool = (typeof (thePCStatus.pc_mining_tool) != 'undefined' ? thePCStatus.pc_mining_tool : 'nicehash');
				var pc_mining_options = (typeof (thePCStatus.pc_mining_options) != 'undefined' ? thePCStatus.pc_mining_options : '');
				ICAFEMENU_CORE.callFun("MINER_START " + pc_mining_tool + " " + pc_mining_options);
			}, client_mining_idle_mins * 1000 * 60);
		}
		return;
	}
	// end login page

	// already logined
	theConvertToMember.init();

	// 切换服务器了
	if (typeof (thePCStatus.license_server_code) != 'undefined' && vueGlobal.license_server_code != thePCStatus.license_server_code) {
		if (vueGlobal.license_server_code != '') {
			// 将token置为空,好让即使本次失败, 后续还是有机会继续获取token
			var clientMemberInfo = JSON.parse(localStorage.getItem('clientMemberInfo'));
			clientMemberInfo.token = '';
			localStorage.setItem('clientMemberInfo', JSON.stringify(clientMemberInfo));

			await requestApiToken().catch(ICafeApiError.skip);
		}
		vueGlobal.license_server_code = thePCStatus.license_server_code;
	}

	// login in & previous state is checkout & not locked
	if (!last_login_status) // from login to logined
	{
		// 如果是能获取到当前status_pc_token的用户, 则通过status_pc_token来进行登录
		if (!theIsHomeVersion) {
			if (theSettings.license_show_client_mode == 'full screen') {
				ICAFEMENU_CORE.callFun("SETWINDOWSIZE -3*-3"); // no topmost
				theLastWindowSize = "-3*-3";
				ICAFEMENU_CORE.callFun("SETWINDOWTOPMOST 0");
			}

			if (typeof (theSettings.license_show_client_mode) == 'undefined' || theSettings.license_show_client_mode == 'maximized') {
				ICAFEMENU_CORE.callFun("SETWINDOWSIZE -2*-2");
				theLastWindowSize = "-2*-2";
			}

			if (theSettings.license_show_client_mode == 'minimized') {
				ICAFEMENU_CORE.callFun("SETWINDOWSIZE -2*-2");
				theLastWindowSize = "-2*-2";
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
		}

		ICAFEMENU_CORE.callFun('RUN cmd /c "set ICAFEMENU_MEMBER=' + (thePCStatus.member_account ?? '') + '&& login.bat"');

		let token = await requestApiToken().catch(ICafeApiError.skip);
		if(token && thePCStatus.member_account)
		{
			let message = await theApiClient.callCafeApi('memberMessage', 'get', { member_account: thePCStatus.member_account }).catch(ICafeApiError.skip);
			if(message)
			{
				toastr.options.tapToDismiss = true;
				toastr.options.timeOut = 0;
				toastr.options.extendedTimeOut = 0;
				for (var i = 0; i < message.log_list.length; i++) {
					toastr.info(htmlToText(message.log_list[i].log_details), translate_string('Message from ') + message.log_list[i].log_staff_name, {
						toastClass: "custom-transparent-toast"
					});
				}
			}
		}

		if (theSettings.license_start_game_tracker ?? 0)
		{
			let rankData = await theApiClient.callCafeApi('gameRankData', 'get', { pc_name: thePCInfo.pc_name }).catch(ICafeApiError.skip);
			if(rankData)
				vueHome.leaderboardItems = rankData.rank
		}

		// Set member info for the home page sidebar on first login
		memberInfo.member_info_name = (thePCStatus.member_account || '').toUpperCase() + " / " + (thePCStatus.member_group_name || '').toUpperCase();
		memberInfo.member_name = memberInfo.member_name || (thePCStatus.member_account || '').toUpperCase();
		memberInfo.member_group_name = (thePCStatus.member_group_name || '').toUpperCase();

		theHome.show(true);
		
		// [NEW] Initialize offers data for sidebar
		if (typeof theShop !== 'undefined' && typeof theShop.initOfferGoods === 'function') {
			theShop.initOfferGoods();
		}

		if (theSettings.show_game_page_as_default)
			theGameList.show(true);

		stop_login_timers();

		if (theIsHomeVersion) {
			theEvents.show();
		}
		else {
			if (theSettings.license_save_enable) {
				if (is_member_logined())
					ICAFEMENU_CORE.callFun("INIT_GAME_SAVING " + thePCStatus.member_account);
				else
					ICAFEMENU_CORE.callFun("INIT_GAME_SAVING guest_" + thePCInfo.pc_name);
			}

			if ((theSettings.allow_client_print ?? 0) != 0) {
				ICAFEMENU_CORE.callFun("START_PRINT_WATCH")
			}
		}

		// start monitoring game track for fornite/lol
		if (theGameTrackerInterval != null) {
			clearInterval(theGameTrackerInterval);
			theGameTrackerInterval = null;
		}
		// stop game api tracker currently
		// theGameTrackerInterval = setInterval(game_tracker, 1000 * 60 * 5);
	}
	// end from login to logined

	// already logined but wss reconnect, or topup update left time

	if (typeof (thePCStatus.recent_booking) != 'undefined' && thePCStatus.recent_booking != null) {
		toast(translate_string("Recent booking") + ": " + thePCStatus.recent_booking, 'warning');
	}

	// now state is login in (from logined to logined)

	// don't show checkout button if not member login
	vueGlobal.menuButton.logout = false;
	if (thePCStatus.member_group_id != MEMBER_GROUP_POSTPAID && thePCStatus.member_group_id != MEMBER_GROUP_PREPAID && thePCStatus.member_group_id != MEMBER_GROUP_OFFER)
		vueGlobal.menuButton.logout = true;
	if (theSettings.allow_prepaid_checkout == 1 && thePCStatus.member_group_id != MEMBER_GROUP_POSTPAID)
		vueGlobal.menuButton.logout = true;

	// show member info
	memberInfo.member_info_name = (thePCStatus.member_account || '').toUpperCase() + " / " + (thePCStatus.member_group_name || '').toUpperCase();
	memberInfo.member_name = (thePCStatus.member_account || '').toUpperCase();
	memberInfo.member_group_name = (thePCStatus.member_group_name || '').toUpperCase();
	memberInfo.canChangePassword = (() => {
		// 1. client settings 没有开启社交登录的(social_login)
		// 2. member setttings 开启了(allow_password_login_always)
		// 3. 会员没有绑定社交帐号的
		if (theSettings.social_login != 1) {
			return true;
		}
		//TODO get allow_password_login_always
		if (theSettings.allow_password_login_always == 1) {
			return true;
		}
		//TODO get member_oauth_platform
		if ((thePCStatus.member_oauth_platform ?? 'account') == 'account') {
			return true;
		}
		return false;
	})()
	PetiteVue.nextTick(() => {
		ui_init();
		$('[data-toggle="tooltip"]').tooltip();
	});

	// $('.cafe_info_member_logo').attr('src', ICAFEMENU_CORE.icons_path('mg-' + (thePCStatus.member_group_id > MEMBER_GROUP_DEFAULT ? thePCStatus.member_group_id.toString() : '0') + '.png') );

	if (theSettings.license_using_billing == 1) {
		theAvailableOffers = []; // total和balance当成了一个特殊的offer，所以theAvailableOffers[] = [total, offer1, offer2, ... offterN, balance]
		var id = 1;
		for (var i = 0; i < thePCStatus.available_offers.length; i++) {
			var in_using = (thePCStatus.available_offers[i].product_name == thePCStatus.offer_in_using && i == 0);
			theAvailableOffers.push({
				id: id++,
				in_using: in_using,
				time_type: 'offer',
				name: (thePCStatus.available_offers[i].product_name || '').toUpperCase(),
				total_secs: thePCStatus.available_offers[i].product_seconds,
				left_secs: (in_using ? thePCStatus.status_connect_time_left : thePCStatus.available_offers[i].member_offer_left_seconds),
				last_notify_mins: 1000,
				active: '',
				member_offer_id: thePCStatus.available_offers[i].member_offer_id
			});
		}

		if (thePCStatus.member_balance_bonus_left_seconds > 0) {
			var in_using = (thePCStatus.offer_in_using == null || thePCStatus.offer_in_using.length == 0);
			var name = translate_string('BALANCE');
			var left_secs = in_using ? thePCStatus.status_connect_time_left : thePCStatus.member_balance_bonus_left_seconds;
			if (thePCStatus.member_group_id == MEMBER_GROUP_POSTPAID || thePCStatus.member_group_id == MEMBER_GROUP_FREE) {
				left_secs = thePCStatus.status_connect_time_left;
			}

			theAvailableOffers.push({
				id: id++,
				in_using: in_using,
				time_type: 'balance',
				name: name,
				total_secs: thePCStatus.member_balance_bonus_left_seconds,
				left_secs: left_secs,
				last_notify_mins: 1000,
				active: ''
			});
		}

		// add total
		if (theAvailableOffers.length > 0) {
			var total_secs = 0;
			var left_secs = 0;
			theAvailableOffers.forEach(function (obj) {
				total_secs += obj.total_secs;
				left_secs += obj.left_secs;
			});

			theAvailableOffers.splice(0, 0, {
				id: id++,
				in_using: false,
				time_type: 'total',
				name: translate_string('TOTAL'),
				total_secs: total_secs,
				left_secs: left_secs,
				last_notify_mins: 1000,
				active: ''
			});
		}

		if (theAvailableOffers.length > 0 && theAvailableOffers[1].name.toString().toUpperCase() == thePCStatus.offer_in_using.toString().toUpperCase()) {
			theAvailableOffers[1].in_using = true;
			theAvailableOffers[1].active = 'active';
		}

		vueAvailableOffers.items = theAvailableOffers;
		
		// 优先显示正在倒计时的优惠（使用中）
		for(var k=0; k < vueAvailableOffers.items.length; k++) {
			if(vueAvailableOffers.items[k].in_using && vueAvailableOffers.items[k].time_type != 'total') {
				vueAvailableOffers.currentIndex = k;
				break;
			}
		}
		// 计算并同步 remaining 和 percent 字段到 vueAvailableOffers.items
		for (var j = 0; j < vueAvailableOffers.items.length; j++) {
			vueAvailableOffers.items[j].remaining = format_time(vueAvailableOffers.items[j].left_secs);
			if (vueAvailableOffers.items[j].total_secs > 0) {
				vueAvailableOffers.items[j].percent = Math.min(parseInt((vueAvailableOffers.items[j].left_secs / vueAvailableOffers.items[j].total_secs) * 100.0), 100);
			} else {
				vueAvailableOffers.items[j].percent = 0;
			}
		}
		PetiteVue.nextTick(() => {
			ui_init();
			$('[data-toggle="tooltip"]').tooltip();
		});

		$('#carousel_main').carousel({ interval: false });
	}

	countdown_start();
	if (!theIsHomeVersion) {
		if (theQueryRunGameIdsIntervalId != null) {
			clearInterval(theQueryRunGameIdsIntervalId);
			theQueryRunGameIdsIntervalId = null;
		}
		query_rungame_ids();
		theQueryRunGameIdsIntervalId = setInterval(query_rungame_ids, 3000);
	}

	// show left money and bonus - use computed vueGlobal properties
	vueGlobal.memberGroupId = thePCStatus.member_group_id;

	if (theSettings.license_using_billing == 1 && thePCStatus.member_group_id != MEMBER_GROUP_POSTPAID && thePCStatus.member_group_id != MEMBER_GROUP_FREE) {
		var member_balance_realtime = formatNumber(parseFloat(thePCStatus.member_balance_realtime));
		if (thePCStatus.member_balance_realtime > 1000000)
			member_balance_realtime = formatNumber(parseFloat(thePCStatus.member_balance_realtime / 1000000.0)) + "M";
		memberInfo.member_balance_realtime = member_balance_realtime;

		var member_balance_bonus_realtime = formatNumber(parseFloat(thePCStatus.member_balance_bonus_realtime));
		if (thePCStatus.member_balance_bonus_realtime > 1000000)
			member_balance_bonus_realtime = formatNumber(parseFloat(thePCStatus.member_balance_bonus_realtime / 1000000.0)) + "M";
		memberInfo.member_balance_bonus_realtime = member_balance_bonus_realtime;

		var member_coin_balance = formatNumber(parseFloat(thePCStatus.member_coin_balance));
		if (thePCStatus.member_coin_balance > 1000000)
			member_coin_balance = formatNumber(parseFloat(thePCStatus.member_coin_balance / 1000000.0)) + "M";
		memberInfo.member_coin_balance = member_coin_balance;
		
		var loan = formatNumber(parseFloat(thePCStatus.member_loan));
		if (thePCStatus.member_loan > 1000000)
			loan = formatNumber(parseFloat(thePCStatus.member_loan / 1000000.0)) + "M";
		memberInfo.member_loan = loan;

		PetiteVue.nextTick(() => {
			ui_init();
			$('[data-toggle="tooltip"]').tooltip();
		});
	}
	// end now state is login in
	return;
}

// start listen cmd from icafemenu.exe
(() => {
	ICAFEMENU_CORE.onCmd("CallExeDone", strParam => {
		var cols = strParam.split(' ');
		if (typeof (cols) == 'undefined')
			return;
		if (cols.length == 0)
			return;
		var action = cols[0];

		if (action == 'INIT_GAME_SAVING') {
			setTimeout(function () {
				$('input[name=search]').css({ background: '#ffffff' });

				setTimeout(function () {
					$('input[name=search]').css({ background: 'transparent' });
				}, 500);

			}, 500);
		}
	}).onCmd("SHOWMSG", strParam => {
		sweetAlert("", translate_string(strParam), "info");
	}).onCmd('TOAST', strParam => {
		toast(translate_string(strParam));
	}).onCmd('WSS_TIMEOUT', strParam => {
		// direct to login page, allow player work when cloud server down
		// process_wss_package({ action: 'client_status', version: 2, type: 'request', from: 'wss-server', target: 'client', status: 'success', data: {client_status: { member_account: '' }}});
	}).onCmd('WSS_LOGIN', strParam => {
		theWssLogined = true;
	}).onCmd('WSS_LOGIN_FAILED', strParam => {
		//if (!theIsHomeVersion)
		//	return;
		vueGlobal.isLoading = false;
		show_login_page('login');
		sweetAlert("", strParam.length ? translate_string(strParam) : translate_string('Login failed'), 'error');
	}).onCmd('WSS_DISCONNECTED', strParam => {
		theWssLogined = false;
		if (theIsHomeVersion)
			return;
	}).onCmd('WM_DISPLAYCHANGE', strParam => {
		if (theLastWindowSize.length > 0)
			ICAFEMENU_CORE.callFun("SETWINDOWSIZE " + theLastWindowSize);
	}).onCmd('COVERSHOW', strParam => {
		vueGlobal.isLoading = true;
	}).onCmd('COVERHIDE', strParam => {
		vueGlobal.isLoading = false;
	}).onCmd("RUNGAME_IDS", strParam => {
		var ids = strParam.split(',');
		var runGames = [];
		for (var i = 0; i < ids.length; i++) {
			theGames.forEach(function (obj) {
				if (obj.pkg_id == ids[i]) {
					runGames.push({
						pkg_id: obj.pkg_id,
						pkg_name: obj.pkg_name,
						icon_url: ICAFEMENU_CORE.icons_path(obj.pkg_id + '.png')
					});
				}
			});
		}
		vueGlobal.runningGames = runGames;
		PetiteVue.nextTick(() => {
			$('[data-toggle="tooltip"]').tooltip();
		});
	}).onCmd("APIResponse", strParam => {
		var pos = strParam.indexOf(' ');
		var api_action = strParam.substr(0, pos);
		strParam = strParam.substr(pos + 1);
		if (strParam.length == 0)
			return;
		var data = JSON.parse(strParam);

		if (api_action.indexOf('type=event-') >= 0) {
			theEvents.onAPIResponse(api_action, data);
			return;
		}

		if (api_action.indexOf('type=game-rank-data') >= 0) {
			if (data.result == 0) {
				sweetAlert("", translate_string(data.message), 'error');
				return;
			}
			vueHome.leaderboardItems = JSON.parse(JSON.stringify(data.rank));
			return;
		}
	}).onCmd("PCInfo", strParam => { // 这个地方实际上收不到消息
		thePCInfo = JSON.parse(strParam);
		if (vueGlobal.currentView !== 'login')
			return;
		if (typeof (theSettings.client_pc_name_size) == 'undefined') {
			theSettings.client_pc_name_size = 40;
		}
		set_monitor_turn_off_timeout(thePCInfo.pc_turn_off_monitor_seconds);
		// Update vueGlobal.pcName - template binds to this
		vueGlobal.pcName = thePCInfo.pc_name;
		vueGlobal.versionDate = thePCInfo.version_date;
	}).onCmd("GameStats", strParam => {
		// 这里的参数与clientapi.php里面的fortnite-match-stats返回的data是一致的
		// strParam 示例: '{"type":"fortnite-match-stats", "win_coins":100}';
		var data = JSON.parse(strParam);
		var game_stats_type = data.type ?? '';
		var win_coins = data.win_coins ?? 0;
		var gameName = getGameName(game_stats_type);
		var message = "You earned " + win_coins + " coins in the " + gameName + "!"
		// win_coins 是否大于0
		if (win_coins > 0) {
			sweetAlert("", translate_string(message), "success");
		}
	}).onCmd("VOLUME", strParam => {
		const value = strParam.split(' ')
		if (value.length !== 2) 
			return
		const volume = parseInt(value[0])
		const isMuted = value[1] === '1'
		theAudioSettings.setVolumeMute(volume, isMuted)
	}).onCmd("MOUSE_DOUBLE_CLICK_SPEED", strParam => {
		const value = parseInt(strParam)
		theMouseSettings.setDoubleClickSpeed(value)
	}).onCmd("MOUSE_MOVE_SPEED", strParam => {
		const value = parseInt(strParam)
		theMouseSettings.setMoveSpeed(value)
	}).onCmd("MOUSE_SMOOTHNESS", strParam => {
		const value = parseInt(strParam)
		theMouseSettings.setMouseSmoothness(value === 1)
	}).onCmd("PRINT_CONFIRM", strParam => {
		const pageCount = parseInt(strParam)
		ICAFEMENU_CORE.callFun("SHOWWINDOW")
		theShopPrint.setup()

		if (vuePrint.blackwhite == null || vuePrint.color == null) {
			sweetAlert("", translate_string("iCafeCloud Printer not installed, please contact administrator!"), "error")
			return
		}

		vuePrint.product_id = vuePrint.blackwhite.product_id
		vuePrint.page_count = pageCount
		theShopPrint.cart_refresh()
		vueGlobal.modals.print = true;
	});

})()