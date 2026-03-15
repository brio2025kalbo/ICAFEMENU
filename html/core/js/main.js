

theSettings.allow_prepaid_checkout ??= 0;
theSettings.mini_qr_payment ??= 0;
theSettings.join_us ??= '';
theSettings.social_login ??= 0;
theSettings.allow_password_login_always ??= 0;
theSettings.game_rank_options_fortnite = (JSON.parse(theSettings.supported_games)?.fortnite?.rank_options) ?? 1;
theSettings.game_rank_options_pubg = (JSON.parse(theSettings.supported_games)?.pubg?.rank_options) ?? 1;
theSettings.game_rank_options_lol = (JSON.parse(theSettings.supported_games)?.lol?.rank_options) ?? 1;
theSettings.game_rank_options_dota2 = (JSON.parse(theSettings.supported_games)?.dota2?.rank_options) ?? 1;
theSettings.game_rank_options_valorant = (JSON.parse(theSettings.supported_games)?.valorant?.rank_options) ?? 1;
theSettings.game_rank_options_csgo = (JSON.parse(theSettings.supported_games)?.csgo?.rank_options) ?? 1;
theSettings.game_rank_options_apex = (JSON.parse(theSettings.supported_games)?.apex?.rank_options) ?? 1;
theSettings.bonus_buy_offer ??= 0;
theSettings.use_bonus_first ??= 1;
theSettings.max_bonus_percentage ??= 100;

var thePCStatus = { member_account: ''};
var theLockScreenPassword = '';
var theWssLogined = false;
var theClientStatusInitialized = false; // when first wss connected, received client_status package from idc.
var theLastWindowSize = '';
var theMonitorTurnOffStartTime = 0;
var theIsHomeVersion = false;

// times
var theIdleMonitorTimerId = null;
var theIdleMiningTimerId = null;
var theCountDownIntervalId = null;
var theQueryRunGameIdsIntervalId = null;
var theMonitorTurnOffIntervalId = null;
var theAvailableOffers = [];
var theGameTrackerInterval = null;

var	theHome = new Home();
var	theTax = new Tax();
var	theShop = new Shop();
var	theShopPrint = new ShopPrint();
var	theGameList = new GameList();
var	theEvents = new Events();
var	theRank = new Rank();
var	theTopupLogin = new TopupLogin();
var	theMemberLogin = new MemberLogin();
var	theMemberRegister = new MemberRegister();
var	theForgotPassword = new ForgotPassword();
var	theAudioSettings = new AudioSettings();
var	theMouseSettings = new MouseSettings();
var theStartSession = new StartSession();

// avoid multiple submit


///////////////////////////////////// share functions  ////////////////////////////////////////////

///////////////////////////////////// form submit ////////////////////////////////////////////

///////////////////////////////////// element click events ////////////////////////////////////////////

///////////////////////////////////// message process ////////////////////////////////////////////
///////////////////////////////////// UI ////////////////////////////////////////////

// <lang> No permission </lang>
// <lang> Account not exists </lang>
// <lang> Wrong password </lang>
// <lang> Operation failure </lang>
// <lang> Invalid parameter </lang>
// <lang> The password was changed successfully. </lang>
// <lang> Invalid client </lang>
// <lang> Invalid parameter </lang>
// <lang> Update client information failed </lang>
// <lang> Invalid license </lang>
// <lang> Account already exists </lang>
// <lang> Free to play </lang>
// <lang> All Games </lang>
// <lang> Favorite </lang>
// <lang> Drink </lang>
// <lang> Food </lang>
var vueGlobal = PetiteVue.reactive({
	pageType: 'Home',
	showBottom: true,
	// bodyStyle 用于绑定 body 的 style 属性
	// bodyStyle 用于绑定 body 的 style 属性
	backgroundImage: '',
	get bodyStyle() {
		if (this.backgroundImage) {
			return {
				backgroundImage: this.backgroundImage,
				backgroundSize: 'cover',
				backgroundPosition: 'center'
			};
		}
		return {};
	},
	menuButton: {
		logout: true,
		feedback: true,
		assist: true,
		changepassword: false,
		convertToMember: true,
	},
	showOrderList: false,
	license_server_code: '',
	// 密码可见性切换状态（unlock, lock, change password 模态框）
	showUnlockPassword: false,
	showLockPassword: false,
	showOldPassword: false,
	showNewPassword: false,
	showConfirmPassword: false,
	// Map UI state to variables
	isLoading: false,
	isGiftCart: false,
	cartDate: '',
	videoBackground: {
		visible: false,
		src: '',
		type: ''
	},
	sms: {
		text: translate_string('Get Code'),
		disabled: false
	},
	memberSettings: {},
	currentTime: '',
	modals: {
		orderList: false,
		balanceHistory: false,
		feedback: false,
		lock: false,
		changePassword: false,
		convertMember: false,
		topup: false,
		login: false,
		register: false,
		forgotPassword: false,
		print: false,
		runGame: false,
		gameLicense: false,
		avatar: false,
		confirmCheckout: false,
		confirmShutdown: false,
		confirmReboot: false,
		buy: false, // .myModalBuy
		joinEvent: false, // .myModalJoinEvent
		scanRegister: false, // .myModalQRMemberRegister
		scanLogin: false, // .myModalTopupLogin
		topupLogin: false, // .myModalTopupLogin (duplicate usage check needed)
		clubRules: false,
		personalData: false,
		bookingPassword: false,
		audio: false,
		mouse: false,
		registerMember: false, // .myModalRegisterMember
		shopTopup: false, // .myModalTopup
		checklist: false,
	},
	// Page routing state
	currentPage: 'home', // 'home', 'games', 'shop', 'events', 'rank', 'login', 'start-session'
	isLocked: false,
	isGiftCart: false,
	joinEventId: '',
	joinEventTermsAgreed: false,

	bodyClass: '',
	currentView: 'login',
	// UI state from listen.js refactoring
	currency: '$',
	showOffersDiv: false,
	memberGroupId: 0,
	runningGames: [],
	pcName: '',
	pcNameFontSize: '40px', // PC 名称字体大小
	versionDate: '',
	isHomeVersion: false,
	isHomeCafeId: false,
	isDualMonitor: false,
	isDualMonitorHeight: false,
	loginSubView: 'login', // 'login', 'admin_exit', 'register', 'homecafeid'
	pagesContent: {}, // Store loaded page HTML content
	thePCStatus: thePCStatus,
	theSettings: theSettings,
});

var vueShop = PetiteVue.reactive({
	searchProduct: ''
});

var vueOrderList = PetiteVue.reactive({
	items: [],
	paging_info: []
})

var vueChecklistInfo = PetiteVue.reactive({
	orders: [],
	pc: [],
	member: [],
})

var order_filter_params = PetiteVue.reactive({
	search_text: '',
	sort_name: 'order_create_time',
	sort: 'desc',
	paging_info: {
		total_records: 0,
		pages: 1,
		page: 1,
		page_prev: 1,
		page_next: 1,
		page_start: 1,
		page_end: 1,
	}
})

// 系统设置状态 - 用于音频和鼠标设置的Vue响应式绑定
var vueSystemSettings = PetiteVue.reactive({
	// 音频设置
	volume: 50,
	isMuted: false,
	// 鼠标设置
	doubleClickSpeed: 5,
	moveSpeed: 5,
	mouseSmoothness: false
});

var vueHome = PetiteVue.reactive({
	promotedItems: [],
	promotedActive: 0,
	leaderboardItems: null,
	leaderboardActive: 0,
	memberGroup: [],
	memberCurrentGroup: 0,
	memberPointValue: "",
	promotedGoods: [],
	offerGoods: [],
	currentShopTab: 'promoted',
	currentRankNewsTab: 'news',
	offersActivePage: 0,
	newsActivePage: 0
});
var vueClasses = PetiteVue.reactive({
	items: []
});
var vueGames = PetiteVue.reactive({
	items:[],
	allFilteredItems: [], // 存储所有过滤后的游戏（未切片）
	containerWidth: 0,    // 容器宽度
	containerHeight: 0,   // 容器高度
	topFiveItems: [],
	type: 'all',
	active_class: '',
	status_pc_token: '',
	search: '',
	product_qty_map: {}
});
var vueEventBanner = PetiteVue.reactive({
	event:[]
});
var vueEventsMy = PetiteVue.reactive({
	events:[]
});
var vueEventsActive = PetiteVue.reactive({
		events:[]
});
var vueEventsDetail = PetiteVue.reactive({
	events:[]
});
var vueEventButtons = PetiteVue.reactive({
	event:[]
});
var vueEventDetail = PetiteVue.reactive({
	event:[],
	members: []
});
var vueProductGroupList = PetiteVue.reactive({
	items:[],
	tops: [], 
	current_group_id: PRODUCT_GROUP_ALL,
	second_level_group_id: 0,
});
var vueProducts = PetiteVue.reactive({
	items:[]
});
var vueOffers = PetiteVue.reactive({
	items:[]
});
var vuePcTime = PetiteVue.reactive({
	price_dynamic_enable: 0,
	fixed_price: 0,
	dynamic: [],
});
var vuePrint = PetiteVue.reactive({
	blackwhite: null,
	color: null,
	product_id: 0,
	page_count: 0,
	total_cost: 0,
	total_tax: 0,
	total_discount: 0,
	total_amount: 0,
	max_bonuses: 0,
	payable_balance: 0,
	product_count: 0,
	payment_method: -1,
	member_group_discount_rate: 0,
	member_group_discount_offer: 0,
	member_group_id: 0
})
var vueOrderItems = PetiteVue.reactive({
	items:[],
	total_cost: 0,
	total_tax: 0,
	total_discount: 0,
	total_amount: 0,
	max_bonuses: 0,
	payable_balance: 0,
	product_count: 0,
	payment_method: -1,
	member_group_discount_rate: 0,
	member_group_discount_offer: 0,
	member_group_id: 0
});
var vueGiftOrders = PetiteVue.reactive({
	items:[],
	total_amount: 0
});
var vueAvailableOffers = PetiteVue.reactive({
	items:[],
	currentIndex: 0
});
var vueCafeNews = PetiteVue.reactive({
	items:[]
});
var memberInfo = PetiteVue.reactive({
	member_name: '',
	member_info_name: '',
	member_balance_realtime: '',
	member_balance: 0,
	member_balance_bonus_realtime: '',
	member_balance_bonus: 0,
	member_coin_balance: '',
	postpaid_pc_name: '',
	price_per_hour: '',
	member_photo: null,
	canChangePassword: true,
	member_loan: 0,
	pc_cost: 0,
});

var vueGameInfo = PetiteVue.reactive({
	game: null,
	source: 'game', //game, home
	show: false,
});

var vueLoginMode = PetiteVue.reactive({
	mode: 'default', // default - old mode; tabs - show tab
	active_tab: 'account', // account, access_code
	view: 'menu', // menu, login, access_code
});

var vueRank = PetiteVue.reactive({
	items: {},
	active_game: "fortnite",
});
getEnabledGames().forEach(game => {
	// 跳过custom游戏
	if (game.key == 'custom') {
		return;
	} 
	vueRank.items[game.key] = [];
});

var vueBalanceHistory = PetiteVue.reactive({
	items: [],
	paging_info: [],
	summary: {
		topup: 0,
		spend: 0
	},
})

var balanceHistoryFilterParams = PetiteVue.reactive({
	search_text: '',
	start_date: '',
	end_date: '',
	paging_info: {
		total_records: 0,
		pages: 1,
		page: 1,
		page_prev: 1,
		page_next: 1,
		page_start: 1,
		page_end: 1,
	}
})

var vueTopup = PetiteVue.reactive({
	member_account: '',
	topup_amount: '',
	promo_code: '',
	payment_qr: '',
	payment_url: '',
	payment_type_img: false,
	payment_url_div: false,
	btn_group: true,
	manual_payment_html: '',
	paymongo_html: '',
	paymongo_html: '',
	midtrans_html: '',
	finik_html: '',
	payment_html: '', // 用于动态显示支付 HTML (Razorpay, Manual, Paymongo etc)
	payment_type: '',
	topup_time: '',
	// UI 状态
	showFormRows: true,
	showSummary: false,
	showPaymentQr: false,
	// Summary 显示内容
	summaryMember: '',
	summaryAmount: '',
	summaryMinutes: '',
	// 验证错误消息
	errors: {
		member_account: '',
		topup_amount: '',
		topup_time: '',
		promo_code: ''
	},
	// 清除所有错误
	clearErrors() {
		this.errors.member_account = '';
		this.errors.topup_amount = '';
		this.errors.topup_time = '';
		this.errors.promo_code = '';
	},
	// 重置表单状态
	resetOutputs() {
		this.payment_qr = '';
		this.payment_url = '';
		this.btn_group = true;
		this.payment_type_img = false;
		this.payment_url_div = false;
		
		this.manual_payment_html = '';
		this.paymongo_html = '';
		this.midtrans_html = '';
		this.finik_html = '';
		this.payment_html = '';
		this.paymentData = null; // 重置支付数据，确保新二维码能正确显示

		this.showPaymentQr = false;
		this.showFormRows = true;
		this.showSummary = false;
		this.summaryMember = '';
		this.summaryAmount = '';
		this.summaryMinutes = '';
		this.clearErrors();

		// 手动清空 QR 码 DOM 内容
		const qrEl = document.querySelector('#payment_qr');
		if (qrEl) qrEl.innerHTML = '';
	},
	reset() {
		this.topup_amount = '';
		this.topup_time = '';
		this.promo_code = '';
		this.resetOutputs();
	}
})

var vueRunGame = PetiteVue.reactive({
	game_id: '',
	title: ''
})

var vueGameLicense = PetiteVue.reactive({
	account: '',
	password: ''
})

var vueLogin = PetiteVue.reactive({
	username: '',
	password: '',
	access_code: '',
	// 4-digit access code parts
	ac1: '',
	ac2: '',
	ac3: '',
	ac4: '',
	booking_password: '', // for booking password modal
	bookingPCName: '',
	bookingTimeRange: '',
	// 最近预定信息（登录页展示）
	recentBookingAt: '',
	recentBookingLeft: '',
	// 密码可见性切换状态
	showPassword: false,
	showAdminExitPassword: false,
	isKeyboardError: false
});

var vueRegister = PetiteVue.reactive({
	account: '',
	birthday: '',
	password: '',
	confirm_password: '',
	first_name: '',
	last_name: '',
	phone: '',
	email: '',
	id_card: '',
	promo_code: '',
	member_sms_code: '',
	code: '', // sms code input
	agree_club_rules: false,
	agree_personal_data: false,
	// 验证错误消息
	errors: {
		account: '',
		password: '',
		confirm_password: ''
	},
	// 提交状态
	isSubmitting: false,
	// 清除所有错误
	clearErrors() {
		this.errors.account = '';
		this.errors.password = '';
		this.errors.confirm_password = '';
	}
});

var vueTopupLogin = PetiteVue.reactive({
	member_email: '', // topup_memeber_email
	topup_amount: '', // topup_login_amount
	promo_code: '',
	payment_qr: '',
	payment_url: '',
	payment_type_img: false,
	payment_url_div: false,
	btn_group: true,
	manual_payment_html: '',
	paymongo_html: '',
	midtrans_html: '',
	finik_html: '',
	// payment_html: '', // Added this? No, I should add it.
	payment_html: '',
	topup_time: '',
	// UI 状态
	showFormRows: true,
	showSummary: false,
	showPaymentQr: false,
	// Summary 显示内容
	summaryMember: '',
	summaryAmount: '',
	summaryMinutes: '',
	// 验证错误消息
	errors: {
		member_email: '',
		topup_amount: '',
		topup_time: '',
		promo_code: ''
	},
	// 清除所有错误
	clearErrors() {
		this.errors.member_email = '';
		this.errors.topup_amount = '';
		this.errors.topup_time = '';
		this.errors.promo_code = '';
	},
	// Clear output state (QR, payment info, errors) but keep user inputs
	resetOutputs() {
		this.payment_qr = '';
		this.btn_group = true;
		this.payment_type_img = false;
		this.payment_url_div = false;
		this.manual_payment_html = '';
		this.paymongo_html = '';
		this.midtrans_html = '';
		this.finik_html = '';
		this.payment_html = '';
		this.paymentData = null; // 重置支付数据，确保新二维码能正确显示

		this.showPaymentQr = false;
		this.showFormRows = true;
		this.showSummary = false;
		this.summaryMember = '';
		this.summaryAmount = '';
		this.summaryMinutes = '';
		this.clearErrors();

		// Manually clear QR code DOM if needed
		const qrEl = document.querySelector('.myModalTopupLogin #login_payment_qr');
		if (qrEl) qrEl.innerHTML = '';
	},
	// Reset inputs and outputs
	reset() {
		this.member_email = '';
		this.topup_amount = '';
		this.topup_time = '';
		this.promo_code = '';
		this.resetOutputs();
	}
});

var vueForgotPassword = PetiteVue.reactive({
	phone_number: '',
	email: '',
});

var vueAdminExit = PetiteVue.reactive({
	password: '',
	hasError: false
});

// Layout forms state
var vueLayout = PetiteVue.reactive({
	// Lock form
	lockPassword: '',
	unlockPassword: '',
	// Feedback form
	feedbackSubject: '',
	feedbackMessage: '',
	// Change password form
	oldPassword: '',
	newPassword: '',
	confirmPassword: '',
	// Convert member form
	convertAccount: '',
	convertBirthday: '',
	convertPassword: '',
	convertConfirmPassword: '',
	convertFirstName: '',
	convertLastName: '',
	convertPhone: '',
	convertEmail: '',
	convertIdCard: '',
	convertSmsCode: '',
	convertPromoCode: '',
	convertClubRuleChecked: false,
	convertPersonalDataChecked: false,
	// Order search
	_orderSearch: '', // internal storage
	get orderSearch() {
		return this._orderSearch;
	},
	set orderSearch(val) {
		this._orderSearch = val;
		order_search_post();
	}
});

function main()
{

	if(typeof(theSettings.client_themes_front_color) != 'undefined')
	{
		document.documentElement.style.setProperty('--client_themes_front_color', theSettings.client_themes_front_color);
		document.documentElement.style.setProperty('--client_themes_front_color_90', theSettings.client_themes_front_color + 'e6');
		document.documentElement.style.setProperty('--client_themes_front_color_75', theSettings.client_themes_front_color + 'c0');
		document.documentElement.style.setProperty('--client_themes_back_color', theSettings.client_themes_back_color);
		document.documentElement.style.setProperty('--client_themes_back_color_90', theSettings.client_themes_back_color + 'e6');
		document.documentElement.style.setProperty('--client_themes_back_color_75', theSettings.client_themes_back_color + 'c0');
	}
	
	// setting the required prop for each required field
	if(typeof(theSettings.member_settings) != 'undefined')
	{
		vueGlobal.memberSettings = JSON.parse(theSettings.member_settings);
	}

	vueGlobal.currentTime = localTime();
	setInterval(function() {
		vueGlobal.currentTime = localTime();
	},1000*60);

	PetiteVue.createApp({
		vueGlobal,
		vueLoginMode,
		vuePcTime,
		vueTopup,
		vueRunGame,
		vueGameLicense,
		vueLogin,
		vueRegister,
		vueTopupLogin,
		vueForgotPassword,
		vueAdminExit,
		vueLayout,
		get theSettings() { return theSettings }, // Use getter to ensure it picks up latest if changed, though it's likely static.
		mounted() {

			theSettings.allow_topup_at_client ??= 0;
			ui_init(true)
			$('[data-toggle="tooltip"]').tooltip();
		}
	}).mount('body')

	// debug for tooltip
	//$('body').tooltip({selector: "[data-toggle='tooltip']", trigger: "click"});

	theIsHomeVersion = ((theSettings.enable_icafesports ?? 0) == 1);
	vueGlobal.isHomeVersion = theIsHomeVersion;

	if (theIsHomeVersion) {
		if (typeof(theCafe) == 'undefined' || typeof(theSettings) == 'undefined') {
			vueGlobal.isHomeCafeId = true;
			vueGlobal.currentView = 'login';
			return;
		}
	}

	try
	{
		ICAFEMENU_CORE.callFun('applocker');
		run_protect(theSettings.protection_settings ?? null);
		CallFunction("NOOP");
	}
	catch(e)
	{
		// for dev debug in chrome
		CallFunction = function(cmd)
		{
		}

		show_login_page('login');

		thePCStatus = {'member_account': 'test', 'member_group_id': 9,'member_balance_realtime': 888, member_balance_bonus_realtime: 777, 
			member_coin_balance: 666, member_loan: 555, 'member_group_name': 'testGroup', 'available_offers': [{product_name: 'testOffer', product_seconds: 1000, 
			member_offer_left_seconds: 1000,member_offer_id: 1}], 'member_balance_bonus_left_seconds': 1000, 'member_points': 201, 'member_oauth_platform': 'account'};
		memberInfo.member_info_name = (thePCStatus.member_account || '').toUpperCase() + " / " + (thePCStatus.member_group_name || '').toUpperCase();
		memberInfo.member_name = (thePCStatus.member_account || '').toUpperCase();
		memberInfo.member_photo = '#5.png';
		memberInfo.price_per_hour = format_balance(1000);
		thePCInfo.pc_name = 'Test';
		
		vuePcTime.dynamic = [{"time":"30","amount":"8.5"},{"time":"60","amount":"3.4"},{"time":"120","amount":"1.275"},{"time":"600","amount":"0.085"}];
		vuePcTime.price_dynamic_enable = 0;
		vuePcTime.fixed_price = 10;
		// debug 可以在这里设置显示不同页面
		//theHome.show();
		//theStartSession.show();
		
		// This should be reactive via memberInfo.member_photo binding
		// $('.cafe_info_member_logo').attr('src', ICAFEMENU_CORE.icons_path('mg-'+(thePCStatus.member_group_id > MEMBER_GROUP_DEFAULT ? thePCStatus.member_group_id.toString() : '0') + '.png'));
		
		theAvailableOffers = [];
		var id = 1;
		for (var i=0; i<thePCStatus.available_offers.length; i++)
		{
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

		if (thePCStatus.member_balance_bonus_left_seconds > 0)
		{
			var in_using = (thePCStatus.offer_in_using == null || thePCStatus.offer_in_using.length == 0);
			var name = translate_string('BALANCE');
			var left_secs = in_using ? thePCStatus.status_connect_time_left : thePCStatus.member_balance_bonus_left_seconds;

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
		if (theAvailableOffers.length > 0)
		{
			var total_secs = 0;
			var left_secs = 0;
			theAvailableOffers.forEach(function(obj) {
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

		if (theAvailableOffers.length > 0)
		{
			theAvailableOffers[0].in_using = true;
			theAvailableOffers[0].active = 'active';
		}

		vueAvailableOffers.items = JSON.parse(JSON.stringify(theAvailableOffers));
		// 计算并同步 remaining 和 percent 字段到 vueAvailableOffers.items
		for (var j = 0; j < vueAvailableOffers.items.length; j++) {
			vueAvailableOffers.items[j].remaining = format_time(vueAvailableOffers.items[j].left_secs);
			if (vueAvailableOffers.items[j].total_secs > 0) {
				vueAvailableOffers.items[j].percent = Math.min(parseInt((vueAvailableOffers.items[j].left_secs / vueAvailableOffers.items[j].total_secs) * 100.0), 100);
			} else {
				vueAvailableOffers.items[j].percent = 0;
			}
		}
		
		$('#carousel_main').carousel({ interval: false });

		// 这些显示控制已通过 vueGlobal.memberGroupId 在模板中绑定
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
		}
		memberInfo.pc_cost = 100;
		
		vueHome.leaderboardItems = JSON.parse(JSON.stringify(
			{
				"last_month": [{
					"track_member_id": 4342284,
					"track_member_account": "aliitawi",
					"track_game_coins": "5723",
					"track_wins": "57",
					"rank": 1,
					"previous_rank": 1
				}, {
					"track_member_id": 312065975726,
					"track_member_account": "hael",
					"track_game_coins": "4516.6",
					"track_wins": "38",
					"rank": 2,
					"previous_rank": 2
				}, {
					"track_member_id": 4342324,
					"track_member_account": "ramitaiba",
					"track_game_coins": "1118",
					"track_wins": "13",
					"rank": 3,
					"previous_rank": 5
				}, {
					"track_member_id": 312067632456,
					"track_member_account": "nabil558",
					"track_game_coins": "1093",
					"track_wins": "1",
					"rank": 4,
					"previous_rank": 0
				}, {
					"track_member_id": 3408164,
					"track_member_account": "karimkayal",
					"track_game_coins": "821",
					"track_wins": "11",
					"rank": 5,
					"previous_rank": 3
				}, {
					"track_member_id": 3063546152,
					"track_member_account": "hoblos",
					"track_game_coins": "648.5",
					"track_wins": "8",
					"rank": 6,
					"previous_rank": 0
				}],
				"current_month": [{
					"track_member_id": 312065975726,
					"track_member_account": "haelxxxxxxxxxxxxxxxxxxxx",
					"track_game_coins": "530",
					"track_wins": "4",
					"rank": 1,
					"previous_rank": 2
				}, {
					"track_member_id": 312067632966,
					"track_member_account": "ME",
					"track_game_coins": "132.5",
					"track_wins": "1",
					"rank": 2,
					"previous_rank": 0
				}, {
					"track_member_id": 312066792082,
					"track_member_account": "najib1",
					"track_game_coins": "88.5",
					"track_wins": "1",
					"rank": 3,
					"previous_rank": 0
				}, {
					"track_member_id": 312067632968,
					"track_member_account": "os88",
					"track_game_coins": "80.5",
					"track_wins": "1",
					"rank": 4,
					"previous_rank": 0
				}, {
					"track_member_id": 5154524,
					"track_member_account": "rakana",
					"track_game_coins": "54",
					"track_wins": "1",
					"rank": 5,
					"previous_rank": 0
				}, {
					"track_member_id": 312061500211,
					"track_member_account": "fouad1234",
					"track_game_coins": "42.5",
					"track_wins": "0",
					"rank": 6,
					"previous_rank": 0
				}]
			}
		));
		
		// promoted products
		theShop.change_group(PRODUCT_GROUP_PROMOTED);
		
		//event-list
		theEvents.events = 
			[{
				"event_id": "d94eddf1-765c-11ed-aaf5-f23c93e24cac",
				"event_icafe_id": 18875,
				"event_name": "AAA",
				"event_description": "How to join?\r\nClick the join icon, enter your email address and Telegram username, and then click the Join button. In the pop-up browser, follow the prompts to join our Telegram group (name: iCafeCloud Events). If you have already joined, you can skip this step.\r\n\r\nWhy do I have to join the Telegram group?\r\nYou may encounter the following question: Why don\u2019t I have points when I play the game? How are points calculated? What is the daily ranking change? What's new event? When does it begin? How to collect bonus? Can I organize a competition by myself? You can talk to us directly in the Telegram group.\r\n\r\nWhich games does this Event support?\r\nFortnite\r\nLeague of Legends\r\nDota 2\r\nValorant\r\nAfter you join, you can play any game during the one-month competition period. Each game of yours will be counted as points. The more you play, the higher the points, and there are no restrictions.\r\n\r\nHow to calculate points?\r\nFortnite\u2019s integral calculation formula is:\r\nKills x 3\r\nTop 1 = +9 points\r\n\r\nThe formula for calculating League of Legends points is:\r\nWins x 3\r\nKills x 2\r\nAssists x 1.5\r\nDeaths x -0.5\r\nLOL mode x 1.5\r\nTFT mode x 1.25\r\nKills from 11 to 999 = +2 points\r\nAssists from 11 to 9999 = +2 points\r\n\r\nDota2\u2019s integral calculation formula is:\r\nKills x 2\r\nAssists x 1.5\r\nDeaths x -0.5\r\nLastHits x 0.01\r\nKills from 11 to 999 = +10 points\r\nAssists from 11 to 999 = +10 points\r\n\r\nValorant's integral calculation formula is:\r\nAssists x 0.5\r\nKills x 2\r\nWin = +20 points\r\n\r\nBecause each game has a different difficulty in obtaining points, for the sake of fairness, according to big data analysis, the points of each game should be multiplied by the weight value to calculate the total score, specifically: Fornite weight value is 1, League of Legends is 0.06 , Dota2 is 0.065, Valorant is 0.177.\r\n\r\nHow to win the game?\r\nPlay as many games as possible. We don't have any restrictions. The more you play, the higher the points. In order to increase your participation, we take the top 50 as the winners and all can get bonuses.\r\n\r\nHow to get bonus?\r\nFor convenience, our bonus pool is the data currency DOGE. Please abide by the laws and regulations of your country. If it is not allowed, please do not join our competition. After the competition is over, we will distribute bonuses based on the points of the top 50 players. We will notify the winners one by one in the Telegram group and communicate the payment of funds.\r\n\r\nHave fun and Good luck !!\r\n\r\nJoin our gaming community at telegram\r\nhttps:\/\/www.icafecloud.com\/telegram\/",
				"event_game_code": "dota2",
				"event_game_mode": "",
				"event_start_time_utc": "2022-12-06 16:00:00",
				"event_end_time_utc": "2025-09-08 04:00:00",
				"event_score_type": "all",
				"event_top_winners": 3,
				"event_top_matches": 1000,
				"event_bonus_amount": "200.00",
				"event_bonus_currency": "DOGE",
				"event_ticket_price": "0.00",
				"event_is_global": 0,
				"event_update_time": "2023-05-02 20:30:47",
				"event_start_time_local": "2022-12-07 00:00:00",
				"event_end_time_local": "2025-09-08 12:00:00",
				"event_in_banner": 1,
				"event_play_command": "{steam-path}\\steam.exe -silent -noverifyfiles -applaunch 570",
				"emember_id": "05ba2bf1-765d-11ed-aaf5-f23c93e24cac",
				"emember_event_id": "d94eddf1-765c-11ed-aaf5-f23c93e24cac",
				"emember_icafe_id": 18875,
				"emember_member_account": "test",
				"emember_email": "",
				"emember_matches": 0,
				"emember_point_matches": 0,
				"emember_point": 0,
				"emember_wins": 0,
				"emember_kills": 0,
				"emember_assists": 0,
				"emember_deaths": 0,
				"emember_lasthits": 0,
				"emember_game_track_id": 0,
				"emember_ticket_amount": "0.00",
				"emember_bonus": "0.00",
				"emember_bonus_coin_address": "",
				"emember_bonus_pay_status": 0,
				"emember_bonus_trade_id": "",
				"emember_create_time_utc": "2022-12-07 18:29:01",
				"emember_rank_score": 0,
				"emember_status": 1,
				"emember_telegram_username": "",
				"emember_rank": 1,
				"emember_count": 2
			},{
				"event_id": "d94eddf1-765c-11ed-aaf5-f23c93e24cad",
				"event_icafe_id": 18875,
				"event_name": "CCC",
				"event_description": "How to join?\r\nClick the join icon, enter your email address and Telegram username, and then click the Join button. In the pop-up browser, follow the prompts to join our Telegram group (name: iCafeCloud Events). If you have already joined, you can skip this step.\r\n\r\nWhy do I have to join the Telegram group?\r\nYou may encounter the following question: Why don\u2019t I have points when I play the game? How are points calculated? What is the daily ranking change? What's new event? When does it begin? How to collect bonus? Can I organize a competition by myself? You can talk to us directly in the Telegram group.\r\n\r\nWhich games does this Event support?\r\nFortnite\r\nLeague of Legends\r\nDota 2\r\nValorant\r\nAfter you join, you can play any game during the one-month competition period. Each game of yours will be counted as points. The more you play, the higher the points, and there are no restrictions.\r\n\r\nHow to calculate points?\r\nFortnite\u2019s integral calculation formula is:\r\nKills x 3\r\nTop 1 = +9 points\r\n\r\nThe formula for calculating League of Legends points is:\r\nWins x 3\r\nKills x 2\r\nAssists x 1.5\r\nDeaths x -0.5\r\nLOL mode x 1.5\r\nTFT mode x 1.25\r\nKills from 11 to 999 = +2 points\r\nAssists from 11 to 9999 = +2 points\r\n\r\nDota2\u2019s integral calculation formula is:\r\nKills x 2\r\nAssists x 1.5\r\nDeaths x -0.5\r\nLastHits x 0.01\r\nKills from 11 to 999 = +10 points\r\nAssists from 11 to 999 = +10 points\r\n\r\nValorant's integral calculation formula is:\r\nAssists x 0.5\r\nKills x 2\r\nWin = +20 points\r\n\r\nBecause each game has a different difficulty in obtaining points, for the sake of fairness, according to big data analysis, the points of each game should be multiplied by the weight value to calculate the total score, specifically: Fornite weight value is 1, League of Legends is 0.06 , Dota2 is 0.065, Valorant is 0.177.\r\n\r\nHow to win the game?\r\nPlay as many games as possible. We don't have any restrictions. The more you play, the higher the points. In order to increase your participation, we take the top 50 as the winners and all can get bonuses.\r\n\r\nHow to get bonus?\r\nFor convenience, our bonus pool is the data currency DOGE. Please abide by the laws and regulations of your country. If it is not allowed, please do not join our competition. After the competition is over, we will distribute bonuses based on the points of the top 50 players. We will notify the winners one by one in the Telegram group and communicate the payment of funds.\r\n\r\nHave fun and Good luck !!\r\n\r\nJoin our gaming community at telegram\r\nhttps:\/\/www.icafecloud.com\/telegram\/",
				"event_game_code": "dota2",
				"event_game_mode": "",
				"event_start_time_utc": "2022-12-06 16:00:00",
				"event_end_time_utc": "2022-12-08 04:00:00",
				
				"event_ticket_price": "0.00",
				"event_is_global": 0,
				"event_update_time": "2023-05-02 20:30:47",
				"event_start_time_local": "2022-12-07 00:00:00",
				"event_end_time_local": "2022-12-08 12:00:00",
				"event_in_banner": 1,
				"event_play_command": "{steam-path}\\steam.exe -silent -noverifyfiles -applaunch 570",
				"emember_id": "05ba2bf1-765d-11ed-aaf5-f23c93e24cad",
				"emember_event_id": "d94eddf1-765c-11ed-aaf5-f23c93e24cad",
				"emember_icafe_id": 18875,
				"emember_member_account": "test",
				"emember_email": "",
				"emember_matches": 0,
				"emember_point_matches": 0,
				"emember_point": 0,
				"emember_wins": 0,
				"emember_kills": 0,
				"emember_assists": 0,
				"emember_deaths": 0,
				"emember_lasthits": 0,
				"emember_game_track_id": 0,
				"emember_ticket_amount": "0.00",
				"emember_bonus": "0.00",
				"emember_bonus_coin_address": "",
				"emember_bonus_pay_status": 0,
				"emember_bonus_trade_id": "",
				"emember_create_time_utc": "2022-12-07 18:29:01",
				"emember_rank_score": 0,
				"emember_status": 1,
				"emember_telegram_username": "",
				"emember_rank": 1,
				"emember_count": 2
			}, {
				"event_id": "d94eddf1-765c-11ed-aaf5-f23c93e24caa",
				"event_icafe_id": 18875,
				"event_name": "BBB",
				"event_description": "How to join?\r\nClick the join icon, enter your email address and Telegram username, and then click the Join button. In the pop-up browser, follow the prompts to join our Telegram group (name: iCafeCloud Events). If you have already joined, you can skip this step.\r\n\r\nWhy do I have to join the Telegram group?\r\nYou may encounter the following question: Why don\u2019t I have points when I play the game? How are points calculated? What is the daily ranking change? What's new event? When does it begin? How to collect bonus? Can I organize a competition by myself? You can talk to us directly in the Telegram group.\r\n\r\nWhich games does this Event support?\r\nFortnite\r\nLeague of Legends\r\nDota 2\r\nValorant\r\nAfter you join, you can play any game during the one-month competition period. Each game of yours will be counted as points. The more you play, the higher the points, and there are no restrictions.\r\n\r\nHow to calculate points?\r\nFortnite\u2019s integral calculation formula is:\r\nKills x 3\r\nTop 1 = +9 points\r\n\r\nThe formula for calculating League of Legends points is:\r\nWins x 3\r\nKills x 2\r\nAssists x 1.5\r\nDeaths x -0.5\r\nLOL mode x 1.5\r\nTFT mode x 1.25\r\nKills from 11 to 999 = +2 points\r\nAssists from 11 to 9999 = +2 points\r\n\r\nDota2\u2019s integral calculation formula is:\r\nKills x 2\r\nAssists x 1.5\r\nDeaths x -0.5\r\nLastHits x 0.01\r\nKills from 11 to 999 = +10 points\r\nAssists from 11 to 999 = +10 points\r\n\r\nValorant's integral calculation formula is:\r\nAssists x 0.5\r\nKills x 2\r\nWin = +20 points\r\n\r\nBecause each game has a different difficulty in obtaining points, for the sake of fairness, according to big data analysis, the points of each game should be multiplied by the weight value to calculate the total score, specifically: Fornite weight value is 1, League of Legends is 0.06 , Dota2 is 0.065, Valorant is 0.177.\r\n\r\nHow to win the game?\r\nPlay as many games as possible. We don't have any restrictions. The more you play, the higher the points. In order to increase your participation, we take the top 50 as the winners and all can get bonuses.\r\n\r\nHow to get bonus?\r\nFor convenience, our bonus pool is the data currency DOGE. Please abide by the laws and regulations of your country. If it is not allowed, please do not join our competition. After the competition is over, we will distribute bonuses based on the points of the top 50 players. We will notify the winners one by one in the Telegram group and communicate the payment of funds.\r\n\r\nHave fun and Good luck !!\r\n\r\nJoin our gaming community at telegram\r\nhttps:\/\/www.icafecloud.com\/telegram\/",
				"event_game_code": "dota2",
				"event_game_mode": "",
				"event_start_time_utc": "2022-12-06 16:00:00",
				"event_end_time_utc": "2025-09-08 04:00:00",
				"event_score_type": "all",
				"event_top_winners": 3,
				"event_top_matches": 1000,
				"event_bonus_amount": "200.00",
				"event_bonus_currency": "DOGE",
				"event_ticket_price": "0.00",
				"event_is_global": 0,
				"event_update_time": "2023-05-02 20:30:47",
				"event_start_time_local": "2022-12-07 00:00:00",
				"event_end_time_local": "2025-09-08 12:00:00",
				"event_in_banner": 1,
				"event_play_command": "{steam-path}\\steam.exe -silent -noverifyfiles -applaunch 570",
				"event_status": 'active'
			}];
		theEvents.build_event_list_html();
		//event-detail
		var eventData = 
			{
				"event_id": "d94eddf1-765c-11ed-aaf5-f23c93e24cac",
				"event_icafe_id": 18875,
				"event_name": "AAA",
				"event_description": "How to join?\r\nClick the join icon, enter your email address and Telegram username, and then click the Join button. In the pop-up browser, follow the prompts to join our Telegram group (name: iCafeCloud Events). If you have already joined, you can skip this step.\r\n\r\nWhy do I have to join the Telegram group?\r\nYou may encounter the following question: Why don\u2019t I have points when I play the game? How are points calculated? What is the daily ranking change? What's new event? When does it begin? How to collect bonus? Can I organize a competition by myself? You can talk to us directly in the Telegram group.\r\n\r\nWhich games does this Event support?\r\nFortnite\r\nLeague of Legends\r\nDota 2\r\nValorant\r\nAfter you join, you can play any game during the one-month competition period. Each game of yours will be counted as points. The more you play, the higher the points, and there are no restrictions.\r\n\r\nHow to calculate points?\r\nFortnite\u2019s integral calculation formula is:\r\nKills x 3\r\nTop 1 = +9 points\r\n\r\nThe formula for calculating League of Legends points is:\r\nWins x 3\r\nKills x 2\r\nAssists x 1.5\r\nDeaths x -0.5\r\nLOL mode x 1.5\r\nTFT mode x 1.25\r\nKills from 11 to 999 = +2 points\r\nAssists from 11 to 9999 = +2 points\r\n\r\nDota2\u2019s integral calculation formula is:\r\nKills x 2\r\nAssists x 1.5\r\nDeaths x -0.5\r\nLastHits x 0.01\r\nKills from 11 to 999 = +10 points\r\nAssists from 11 to 999 = +10 points\r\n\r\nValorant's integral calculation formula is:\r\nAssists x 0.5\r\nKills x 2\r\nWin = +20 points\r\n\r\nBecause each game has a different difficulty in obtaining points, for the sake of fairness, according to big data analysis, the points of each game should be multiplied by the weight value to calculate the total score, specifically: Fornite weight value is 1, League of Legends is 0.06 , Dota2 is 0.065, Valorant is 0.177.\r\n\r\nHow to win the game?\r\nPlay as many games as possible. We don't have any restrictions. The more you play, the higher the points. In order to increase your participation, we take the top 50 as the winners and all can get bonuses.\r\n\r\nHow to get bonus?\r\nFor convenience, our bonus pool is the data currency DOGE. Please abide by the laws and regulations of your country. If it is not allowed, please do not join our competition. After the competition is over, we will distribute bonuses based on the points of the top 50 players. We will notify the winners one by one in the Telegram group and communicate the payment of funds.\r\n\r\nHave fun and Good luck !!\r\n\r\nJoin our gaming community at telegram\r\nhttps:\/\/www.icafecloud.com\/telegram\/",
				"event_game_code": "dota2",
				"event_game_mode": "",
				"event_start_time_utc": "2022-12-06 16:00:00",
				"event_end_time_utc": "2025-09-08 04:00:00",
				"event_score_type": "all",
				"event_top_winners": 3,
				"event_top_matches": 1000,
				"event_bonus_amount": "200.00",
				"event_bonus_currency": "DOGE",
				"event_ticket_price": "0.00",
				"event_is_global": 0,
				"event_update_time": "2023-05-02 20:30:47",
				"event_start_time_local": "2022-12-07 00:00:00",
				"event_end_time_local": "2025-09-08 12:00:00",
				"event_in_banner": 1,
				"event_play_command": "{steam-path}\\steam.exe -silent -noverifyfiles -applaunch 570",
				"emember_id": "05ba2bf1-765d-11ed-aaf5-f23c93e24cac",
				"emember_event_id": "d94eddf1-765c-11ed-aaf5-f23c93e24cac",
				"emember_icafe_id": 18875,
				"emember_member_account": "test",
				"emember_email": "",
				"emember_matches": 0,
				"emember_point_matches": 0,
				"emember_point": 0,
				"emember_wins": 0,
				"emember_kills": 0,
				"emember_assists": 0,
				"emember_deaths": 0,
				"emember_lasthits": 0,
				"emember_game_track_id": 0,
				"emember_ticket_amount": "0.00",
				"emember_bonus": "0.00",
				"emember_bonus_coin_address": "",
				"emember_bonus_pay_status": 0,
				"emember_bonus_trade_id": "",
				"emember_create_time_utc": "2022-12-07 18:29:01",
				"emember_rank_score": 0,
				"emember_status": 1,
				"emember_telegram_username": "",
				"emember_rank": 1,
				"emember_count": 2,
				"members": [{
					"emember_id": "18c1ceba-d6e8-11ed-b1de-f23c93e24cac",
					"emember_event_id": "d94eddf1-765c-11ed-aaf5-f23c93e24cac",
					"emember_icafe_id": 18875,
					"emember_member_account": "bin",
					"emember_email": "",
					"emember_matches": 0,
					"emember_point_matches": 0,
					"emember_point": 0,
					"emember_wins": 0,
					"emember_kills": 0,
					"emember_assists": 0,
					"emember_deaths": 0,
					"emember_lasthits": 0,
					"emember_game_track_id": 0,
					"emember_ticket_amount": "0.00",
					"emember_bonus": "0.00",
					"emember_bonus_coin_address": "",
					"emember_bonus_pay_status": 0,
					"emember_bonus_trade_id": "",
					"emember_create_time_utc": "2023-04-09 15:06:25",
					"emember_rank_score": 0,
					"emember_status": 1,
					"emember_telegram_username": "",
					"emember_rank": 1
				}, {
					"emember_id": "05ba2bf1-765d-11ed-aaf5-f23c93e24cac",
					"emember_event_id": "d94eddf1-765c-11ed-aaf5-f23c93e24cac",
					"emember_icafe_id": 18875,
					"emember_member_account": "test",
					"emember_email": "",
					"emember_matches": 0,
					"emember_point_matches": 0,
					"emember_point": 0,
					"emember_wins": 0,
					"emember_kills": 0,
					"emember_assists": 0,
					"emember_deaths": 0,
					"emember_lasthits": 0,
					"emember_game_track_id": 0,
					"emember_ticket_amount": "0.00",
					"emember_bonus": "0.00",
					"emember_bonus_coin_address": "",
					"emember_bonus_pay_status": 0,
					"emember_bonus_trade_id": "",
					"emember_create_time_utc": "2022-12-07 18:29:01",
					"emember_rank_score": 0,
					"emember_status": 1,
					"emember_telegram_username": "",
					"emember_rank": 2
				}]
			};
		for (var i=0; i<theEvents.events.length; i++) {
			if (theEvents.events[i].event_id == eventData.event_id) {
				theEvents.events[i] = eventData;

				theEvents.events[i].event_status = 'active';
				if (moment(theEvents.events[i].event_end_time_local).isBefore())
					theEvents.events[i].event_status = 'past';
				if (moment(theEvents.events[i].event_start_time_local).isAfter())
					theEvents.events[i].event_status = 'upcoming';

				theEvents.gamecode2names.forEach(function(game) {
					if (theEvents.events[i].event_game_code == game.code) {
						theEvents.events[i].game_name = game.name;
					}
				});

				// If current member record need push to members end
				if (theEvents.events[i].members.length > 0 && theEvents.events[i].emember_id && theEvents.events[i].emember_rank > theEvents.events[i].members[theEvents.events[i].members.length-1].emember_rank) {
					theEvents.events[i].members.push({
						emember_id: theEvents.events[i].emember_id,
						emember_member_account: theEvents.events[i].emember_member_account,
						emember_rank: theEvents.events[i].emember_rank,
						emember_matches: theEvents.events[i].emember_matches,
						emember_point_matches: theEvents.events[i].emember_point_matches,
						emember_bonus: theEvents.events[i].emember_bonus,
						emember_point: theEvents.events[i].emember_point,
						emember_wins: theEvents.events[i].emember_wins,
						emember_kills: theEvents.events[i].emember_kills,
						emember_assists: theEvents.events[i].emember_assists,
						emember_deaths: theEvents.events[i].emember_deaths,
						emember_lasthits: theEvents.events[i].emember_lasthits,
						license_country: theEvents.events[i].license_country,
						license_icafename: theEvents.events[i].license_icafename
					});
				}
				break;
			}
		}

		theEvents.build_event_list_html();
		theEvents.build_event_detail_html(eventData.event_id);
		
		PetiteVue.nextTick(() => {
			ui_init();
			$('[data-toggle="tooltip"]').tooltip();
		});
		return;
	}

	show_login_page('login');

	if (theIsHomeVersion) {
		unlock_all();
		CallFunction("SETWINDOWSIZE -2*-2");
		theLastWindowSize = "-2*-2";
	}

	CallFunction("WSSSTART");
}
// resize handling
const onWindowResize = ICAFEMENU_CORE.debounce(()=> {
	vueGlobal.isDualMonitor = window.innerWidth > screen.width;
	vueGlobal.isDualMonitorHeight = window.innerHeight > screen.height;
	
	const gamesContainer = document.querySelector('#games .games-container');
	if (is_logined() && gamesContainer && gamesContainer.offsetParent !== null) {
		if (typeof theGameList !== 'undefined') {
			theGameList.load_games_by_class(theGameList.filter_params.type, theGameList.filter_params.class, theGameList.filter_params.search);
		}
	}
});

window.addEventListener('resize', onWindowResize);
window.addEventListener('load', onWindowResize);
window.ResizeObserver && (async ()=>(new ResizeObserver(() => onWindowResize())).observe(document.body))()

$(document).keydown(function (event)
{
	theMonitorTurnOffStartTime = new Date();

	if (!is_logined()) {
		if (event.keyCode == 27)
			show_login_page('admin_exit');
		return;
	}

	if (is_locked())
		return;

	// logined and not locking
	// X = 88, B = 66, F = 70, F1 = 112
	if (event.ctrlKey && event.keyCode == 112)
		send_assist();

	if (event.ctrlKey && event.keyCode == 70){
		theGameList.show();
		$('input#search-bar').focus();
		setTimeout(() => $('input#search-bar').focus(), 10);
	}

	if (event.ctrlKey && event.keyCode == 88)
		checkout_click();

	if (event.ctrlKey && event.keyCode == 66)
		theShop.show();

	if (theSettings == null || typeof(theSettings.license_show_client_mode) == 'undefined' || theSettings.license_show_client_mode != 'full screen') {
		if (event.ctrlKey && event.keyCode == 'M'.charCodeAt(0))
			CallFunction('HIDEWINDOW');
	}
});

$(document).mousedown(function(event) {
	if (!is_logined())
		theMonitorTurnOffStartTime = new Date();
	return true;
});

var SmsClassFun = new SmsClass();

var theConvertToMember = new ConvertToMember();

var theVideo = new Video();

var thePCInfo = theApiClient.pcInfo; // listen.js 是动态加载的所以收不到pcinfo消息

function set_monitor_turn_off_timeout(seconds)
{
	if (theMonitorTurnOffIntervalId != null) 
	{
		clearInterval(theMonitorTurnOffIntervalId);
		theMonitorTurnOffIntervalId = null;
	}

	if(seconds == 0)
		return;
	
	theMonitorTurnOffStartTime = new Date();
	theMonitorTurnOffIntervalId = setInterval(function() {

		if (new Date() - theMonitorTurnOffStartTime < seconds * 1000)
			return;

		theMonitorTurnOffStartTime = new Date();
		theMonitorTurnOffStartTime.setFullYear(2050,1,1);
		CallFunction("MONITOR OFF");

	}, 10000);
}

// https://github.com/vuejs/vue/issues/1963
// rebuildData plugin for jquery.data()
(function () {
	$.fn.extend({

	/**
	 *   jQuery.data() liefert ein falsches Ergebnis in Verbindung mit VueJS:
	 *   Werden Elemente dynamisch im DOM verändert, referenziert der jQuery.data()-Cache
	 *   evtl. auf Elemente, die ersetzt wurden. 
	 * 
	 *   Wurde ein [data-]-Attribut einmal über jQuery.fn.data() eingelesen,
	 *   liefert jQuery immer den gecachten Wert – auch wenn sich das Tag-Attribut
	 *   verändert hat, z.B. data-poi-uid="10" in data-poi-uid="33" geändert wurde.
	 */
		'rebuildData': function () {
			return this.each(function () {
				$(this).add($(this).find('*')).each(function () {
					var i, name, data, elem = this,
					attrs = elem && elem.attributes;

					if (elem.nodeType === 1) {
						i = attrs.length;
						var obj = {};
						while (i--) {
							if (attrs[i]) {
								name = attrs[i].name;
								if (name.indexOf("data-") === 0) {
									name = jQuery.camelCase(name.slice(5));
									var val = attrs[i].value;
									if ($.isNumeric(val)) val *= 1;
									obj[name] = val;
								}
							}
						}
						$(this).data(obj);
					}
				});
			});
		}
	});
})(jQuery);

var vueMemberAvatar = PetiteVue.reactive({
	selectedAvatar: '',
	uploadPreview: null,
	uploadFile: null,
	activeTab: 'gallery',
	memberAvatarApp: null,

	switchTab(tab) {
		this.activeTab = tab;
	},
	
	selectAvatar(path) {
		this.selectedAvatar = path;
		this.uploadPreview = null; // Clear upload if gallery selected
		this.uploadFile = null;
	},
	
	async handleAvatarUpload(event) {
		const file = event.target.files[0];
		if (file) {
			if (file.size > 10 * 1024 * 1024) {
				toast('File size too large. Max 10MB.');
				return;
			}
			
			vueGlobal.isLoading = true;
			
			try {
				const compressed = await this.compressAndConvertImage(file);
				
				if (compressed) {
					this.uploadPreview = compressed;
					this.uploadFile = file;
					this.selectedAvatar = ''; // Clear gallery selection
				}
			} catch (error) {
				console.error('Image compression error:', error);
			} finally {
				vueGlobal.isLoading = false;
			}
		}
	},
	
	clearUpload() {
		this.uploadPreview = null;
		this.uploadFile = null;
		const input = document.getElementById('avatarUploadInput');
		if (input) input.value = '';
	},
	
	async saveAvatar() {
		let member_photo = '';
		
		if (this.uploadPreview && this.uploadFile) {
			member_photo = await this.compressAndConvertImage(this.uploadFile);
			if (!member_photo) {
				toast('Failed to process avatar image.');
				return;
			}
			
			const sizeInKB = Math.round((member_photo.length * 3) / 4 / 1024);
			console.log('Final image size before upload:', sizeInKB, 'KB');
			
			if (sizeInKB > 80) {
				toast(`Image size (${sizeInKB}KB) exceeds 80KB limit. Upload cancelled.`);
				return;
			}
			
		} else if (this.selectedAvatar) {
			const filename = this.selectedAvatar.split('/').pop();
			member_photo = filename;
		} else {
			toast('Please select an avatar or upload one.');
			return;
		}
		
		vueGlobal.isLoading = true;
		try {
			const data = await theApiClient.callCafeApi('updateAvatar', 'POST', {
				member_photo: member_photo
			});
			
			if (data) {
				if (typeof memberInfo !== 'undefined') {
					memberInfo.member_photo = member_photo;
				}
				
				vueGlobal.modals.avatar = false;
				toast('Avatar updated successfully!');
			}
		} catch (error) {
			ICafeApiError.show(error);
		} finally {
			vueGlobal.isLoading = false;
		}
	},
	
	
	async compressAndConvertImage(file) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = (e) => {
				const img = new Image();
				img.onload = () => {
					const targetSizeKB = 80;
					let result = null;
					
					const sizeLevels = [200, 150, 120, 100, 80];
					
					for (const maxSize of sizeLevels) {
						const canvas = document.createElement('canvas');
						const ctx = canvas.getContext('2d');
						
						let width = img.width;
						let height = img.height;
						
						if (width > height) {
							if (width > maxSize) {
								height = (height * maxSize) / width;
								width = maxSize;
							}
						} else {
							if (height > maxSize) {
								width = (width * maxSize) / height;
								height = maxSize;
							}
						}
						
						canvas.width = width;
						canvas.height = height;
						
						ctx.drawImage(img, 0, 0, width, height);
						
						for (let quality = 0.9; quality >= 0.1; quality -= 0.1) {
							const tempResult = canvas.toDataURL('image/jpeg', quality);
							const sizeInKB = Math.round((tempResult.length * 3) / 4 / 1024);
							
							if (sizeInKB <= targetSizeKB) {
								result = tempResult;
								console.log(`Compressed to ${sizeInKB}KB at ${Math.round(width)}x${Math.round(height)} with quality ${Math.round(quality * 100)}%`);
								break;
							}
						}
						
						if (result) break;
					}
					
					if (!result) {
						const canvas = document.createElement('canvas');
						const ctx = canvas.getContext('2d');
						const minSize = 60;
						
						let width = img.width;
						let height = img.height;
						
						if (width > height) {
							if (width > minSize) {
								height = (height * minSize) / width;
								width = minSize;
							}
						} else {
							if (height > minSize) {
								width = (width * minSize) / height;
								height = minSize;
							}
						}
						
						canvas.width = width;
						canvas.height = height;
						ctx.drawImage(img, 0, 0, width, height);
						result = canvas.toDataURL('image/jpeg', 0.1);
						
						const finalSizeKB = Math.round((result.length * 3) / 4 / 1024);
						console.log(`Final attempt: ${finalSizeKB}KB at ${Math.round(width)}x${Math.round(height)}`);
					}
					
					const actualSizeKB = Math.round((result.length * 3) / 4 / 1024);
					if (actualSizeKB > targetSizeKB) {
						toast(`Cannot compress image below 80KB (current: ${actualSizeKB}KB). Please choose a different image.`);
						resolve(null);
					} else {
						// 更新预览
						this.uploadPreview = result;
						resolve(result);
					}
				};
				
				img.onerror = () => {
					reject(new Error('Failed to load image'));
				};
				
				img.src = e.target.result;
			};
			
			reader.onerror = (error) => {
				reject(error);
			};
			
			reader.readAsDataURL(file);
		});
	},
	
	async show_member_avatar_modal() {
		if (theSettings.allow_member_upload_photo != 1) {
			return;
		}
		
		const memberData = window.memberInfo;
		
		if (!memberData) {
			toast('Failed to load member information');
			return;
		}
		
		// Reset state
		vueMemberAvatar.selectedAvatar = '';
		vueMemberAvatar.uploadPreview = null;
		vueMemberAvatar.uploadFile = null;
		vueMemberAvatar.activeTab = 'gallery';
		const input = document.getElementById('avatarUploadInput');
		if (input) input.value = '';
		
		if (memberData.member_photo) {
			if (memberData.member_photo.startsWith('#')) {
				vueMemberAvatar.selectedAvatar = memberData.member_photo;
			} else if (memberData.member_photo.startsWith('data:')) {
				vueMemberAvatar.uploadPreview = memberData.member_photo;
			}
		}
		
		// Mount if not already mounted
		if (!this.memberAvatarApp) {
			const el = document.querySelector('.myModalMemberAvatar');
			if (el) {
				 this.memberAvatarApp = PetiteVue.createApp(vueMemberAvatar).mount('.myModalMemberAvatar');
			}
		}
		
		// Show modal
		vueGlobal.modals.avatar = true;
	},
	
	getAvatarUrl(photo) {
		var defaultAvatar = (typeof(theSettings) != 'undefined' && theSettings.cafe_info_member_logo) ? theSettings.cafe_info_member_logo : 'images/default-avatar.png';
		if (!photo) return defaultAvatar;
		if (photo.startsWith('#')) {
			var x =  ICAFEMENU_CORE.core_path('faces/' + photo.substring(1));
			return x;
		}
		if (photo.startsWith('data:')) {
			return photo;
		}
		return defaultAvatar;
	}
});

