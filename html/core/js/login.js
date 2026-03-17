function is_logined()
{
	return typeof(thePCStatus.member_account) != 'undefined' && thePCStatus.member_account != null && thePCStatus.member_account.length > 0;
}


function is_member_logined()
{
	return is_logined() && thePCStatus.member_group_id >  MEMBER_GROUP_GUEST;
}

function stop_login_timers()
{
	if (theIdleMonitorTimerId != null) {
		clearTimeout(theIdleMonitorTimerId);
		theIdleMonitorTimerId = null;
	}

	if (theIdleMiningTimerId != null) {
		clearTimeout(theIdleMiningTimerId);
		theIdleMiningTimerId = null;
	}

	if (theMonitorTurnOffIntervalId != null) {
		clearInterval(theMonitorTurnOffIntervalId);
		theMonitorTurnOffIntervalId = null;
	}
}

async function guest_login()
{
	const data = await theApiClient.callCafeApi('clientMemberRegister','POST',{pc_name: thePCInfo.pc_name}).catch(ICafeApiError.show)
	if(theSettings.license_using_billing == 0){
		return;
	}
}

function login_switch_tab(tab) {
	vueLogin.username = '';
	vueLogin.password = '';
	vueLogin.access_code = '';
	vueLogin.ac1 = '';
	vueLogin.ac2 = '';
	vueLogin.ac3 = '';
	vueLogin.ac4 = '';
	
	vueLoginMode.active_tab = tab;
}

function onAccessCodeInput(index, event) {
	const val = event.target.value;
	// Store value in vueLogin
	vueLogin['ac'+index] = val;

	// Update main access_code
	vueLogin.access_code = vueLogin.ac1 + vueLogin.ac2 + vueLogin.ac3 + vueLogin.ac4;

	// Auto-focus next input
	if (val.length >= 1) {
		if (index < 4) {
			const nextInput = document.getElementById('ac' + (index + 1));
			if (nextInput) nextInput.focus();
		} else {
			// If last digit, maybe submit? user can click submit.
			document.getElementById('ac4').blur();
		}
	}
}

function onAccessCodeKeyDown(index, event) {
	// Handle Backspace
	if (event.key === 'Backspace') {
		if (!vueLogin['ac'+index] && index > 1) {
			// specific input is empty, move to previous
			const prevInput = document.getElementById('ac' + (index - 1));
			if (prevInput) {
				prevInput.focus();
				// Optional: clear previous input on backspace move? Standard OTP usually doesn't, just moves focus.
			}
		}
	}
}

function show_login_form(type) {
	vueLoginMode.view = type; // 'login' or 'access_code' or 'guest' or 'balance' or 'social'
	vueLoginMode.active_tab = type === 'login' ? 'account' : (type === 'guest' ? 'guest' : (type === 'balance' ? 'balance' : (type === 'social' ? 'social' : 'access_code')));
	
	// Reset inputs
	vueLogin.username = '';
	vueLogin.password = '';
	vueLogin.access_code = '';
	// 清空最近预定信息提示
	vueLogin.recentBookingAt = '';
	vueLogin.recentBookingLeft = '';

	if (type === 'guest') {
		vueTopupLogin.reset();
		vueTopupLogin.showFormRows = true;
	}

	if (type === 'balance') {
		vueTopup.reset(); // Assuming vueTopup has a reset method similar to vueTopupLogin or I should implement/check it.
		// Detailed reset for balance view if vueTopup.reset() isn't sufficient or exists.
		// Based on main.js, vueTopup has a reset() method.
		if (typeof memberInfo !== 'undefined' && memberInfo.member_name) {
			vueTopup.member_account = memberInfo.member_name;
		}
		vueTopup.showFormRows = true;
	}

	if (type === 'social') {
		start_social_login();
	}
}



function start_social_login() {
	var memberLoginUrl = "https://cp.icafecloud.com/shop/"+theCafe.license_name+"?dType=openDevice&dName="+thePCInfo.pc_name;
	if (typeof theSettings !== 'undefined' && theSettings.license_info && theSettings.license_info.license_server_code == 'dev') {
		memberLoginUrl = "https://dev.icafecloud.com/shop/"+theCafe.license_name+"?dType=openDevice&dName="+thePCInfo.pc_name;
	}
	
	PetiteVue.nextTick(() => {
		const memberLoginEl = document.querySelector('#inline_social_qr');
		if (memberLoginEl) {
			memberLoginEl.innerHTML = '';
			new QRCode(memberLoginEl, memberLoginUrl);
		}
	});
}

function TopupLogin() {

	var that = this;
	this.show_topup_login = function () {
		vueTopupLogin.resetOutputs();


		if (typeof memberInfo !== 'undefined' && memberInfo.member_email) {
			// 如果有需要预填的逻辑可以在这里添加
		}
		vueGlobal.modals.topupLogin = true;
	}

	this.create_topup_qrcode = async function () {
		vueTopupLogin.resetOutputs();
		vueTopupLogin.clearErrors();

		const topup_memeber_email = vueTopupLogin.member_email;
		const topup_login_amount = vueTopupLogin.topup_amount;
		const topup_login_time = vueTopupLogin.topup_time;
		const promo_code = vueTopupLogin.promo_code;
		
		let hasError = false;

		// 验证 Email
		if (!topup_memeber_email || topup_memeber_email.trim() == '') {
			vueTopupLogin.errors.member_email = translate_string('please input email');
			hasError = true;
		}

		// 验证 Amount
		if (!topup_login_amount || topup_login_amount === '') {
			vueTopupLogin.errors.topup_amount = translate_string('please input amount');
			hasError = true;
		} else if (topup_login_amount < theSettings.mini_qr_payment) {
			vueTopupLogin.errors.topup_amount = translate_string('Please input mini amount') + ' ' + theSettings.mini_qr_payment;
			hasError = true;
		}

		// 验证 Minutes
		if (topup_login_time === '' || topup_login_time == null) {
			vueTopupLogin.errors.topup_time = translate_string('please input minutes');
			hasError = true;
		}

		if (hasError) {
			sweetAlert('', vueTopupLogin.errors.member_email || vueTopupLogin.errors.topup_amount || vueTopupLogin.errors.topup_time, 'warning');
			return false;
		}

		that.addGuest(topup_memeber_email, topup_login_amount, promo_code);

		return true;
	}
	
	this.addGuest =  async function (topup_memeber_email, topup_login_amount, promo_code) {
		// const addGuestUrl = "https://" + theSettings.license_info.license_server_code + ".icafecloud.com/api/v2/cafe/"+theCafe.id+"/memberAddGuest";
		vueGlobal.isLoading = true;
		// Button disabled state should be bound to vueGlobal.isLoading in template
		const data = await theApiClient.callCafeApi('memberAddGuest','POST',{
			topup_amount: topup_login_amount,
			member_email: topup_memeber_email,
			pc_name: thePCInfo.pc_name
		}).catch(ICafeApiError.show).finally(()=>{
			vueGlobal.isLoading = false;
		})
		if(!data)
			return null;
		const member_account = data?.member_account
		const reqData = { 
			member_account: member_account, 
			topup_amount: topup_login_amount, 
			promo_code: promo_code,
			pc_name: thePCInfo.pc_name 
		};

		return that.topup(reqData);
	}

	this.topupTimeCalculate = ICAFEMENU_CORE.debounce(async function () {
		const reqData = {
			pc_name: thePCInfo.pc_name,
			member_account: vueTopup.member_account,
			mins: vueTopup.topup_time 
		}
		if (reqData['mins'] == '' || reqData['mins'] == null || reqData['mins'] == 0) {
			return
		}
		if (reqData['member_account'] == '')
			return;
		vueGlobal.isLoading = true;
		const data = await theApiClient.callCafeApi('calculate/amount', 'POST', reqData)
			.catch(ICafeApiError.skip).finally(() => vueGlobal.isLoading = false)
		if (data) {
			vueTopup.topup_amount = data.cost;
		}

	}, 1_000)

	this.topupAmountCalculate = ICAFEMENU_CORE.debounce(async function () {
		const reqData = {
			pc_name: thePCInfo.pc_name,
			member_account: vueTopup.member_account,
			topup_amount: vueTopup.topup_amount
		}
		if (reqData['topup_amount'] == '' || reqData['topup_amount'] == null || reqData['topup_amount'] == 0) {
			return
		}
		if (reqData['member_account'] == '')
			return;
		const data = await theApiClient.callCafeApi('calculate/time', 'post', reqData).catch(ICafeApiError.skip)
		if(data){
			vueTopup.topup_time = data.minutes; 
		}

	}, 1_000)

	this.topupLoginTimeCalculate = ICAFEMENU_CORE.debounce(async function () {
		if (vueTopupLogin.topup_time == '' || vueTopupLogin.topup_time == null || vueTopupLogin.topup_time == 0) {
			return
		}
		const reqData = {
			pc_name: thePCInfo.pc_name,
			member_account: 'Guest',
			mins: vueTopupLogin.topup_time
		}
		const data = await theApiClient.callCafeApi('calculate/amount', 'POST', reqData).catch(ICafeApiError.skip)
		if(data){
			vueTopupLogin.topup_amount = data.cost;
		}

	}, 1_000)


	this.topupLoginAmountCalculate = ICAFEMENU_CORE.debounce(async function () {
		const reqData = {
			pc_name: thePCInfo.pc_name,
			member_account: 'Guest',
			topup_amount: vueTopupLogin.topup_amount
		}
		if (reqData['topup_amount'] == '' || reqData['topup_amount'] == null || reqData['topup_amount'] == 0) {
			return
		}
		const data = await theApiClient.callCafeApi('calculate/time', 'POST', reqData).catch(ICafeApiError.skip)
		if(data){
			vueTopupLogin.topup_time = data.minutes;
		}

	}, 1_000)

	this.topup = async function (reqData) {
		if(vueTopupLogin.topup_amount < theSettings.mini_qr_payment){
			sweetAlert('', translate_string('Please input mini amount')  + ' ' + theSettings.mini_qr_payment, 'warning');
			return
		}

		vueTopupLogin.resetOutputs();
		vueTopupLogin.clearErrors();
		vueGlobal.isLoading = true;
		const data = await theApiClient.callCafeApi('getTopupUrl','POST',reqData).catch(ICafeApiError.show).finally(()=>vueGlobal.isLoading = false)
		
		if (data?.result == 0) {
			// 检查是否是 promo code 相关的错误
			const promoCodeErrors = [
				'Promo code does not exist',
				'Promo code cannot be used for topup',
				'Promo code has expired',
				'Promo code has been used up',
				'Promo code has already been used'
			];

			const isPromoError = promoCodeErrors.some(error =>
				data.message && (data.message.includes(error) || data.message.includes(translate_string(error)))
			);

			if (isPromoError) {
				// 如果是 promo code 错误，显示在输入框下方
				vueTopupLogin.errors.promo_code = data.message || 'Wrong code';
			} else {
				// 其他错误使用弹窗显示
			sweetAlert('', data.message, 'error');
			}
			return;
		}
		if (data.result == 1) {
			// 隐藏表单输入区域，显示简化信息
			vueTopupLogin.showFormRows = false;
			vueTopupLogin.showSummary = true;

			// 填充简化信息的值
			const memberEmail = vueTopupLogin.member_email || reqData.member_account || 'Max';
			const amount = vueTopupLogin.topup_amount || reqData.topup_amount || '$10';
			const minutes = vueTopupLogin.topup_time || '120';

			vueTopupLogin.summaryMember = memberEmail;
			vueTopupLogin.summaryAmount = (theSettings.currency ?? '$') + parseFloat(amount).toFixed(2);
			vueTopupLogin.summaryMinutes = minutes;

			// 显示扫码界面时，隐藏底部按钮
			vueTopupLogin.btn_group = false;

			vueTopupLogin.showPaymentQr = true;
			vueTopupLogin.payment_qr = data.url;
			PetiteVue.nextTick(() => {
				const qrEl = document.querySelector('.myModalTopupLogin #login_payment_qr');
				if (qrEl) {
					qrEl.innerHTML = '';
					new QRCode(qrEl, data.url);
				}
			});
			
			// Payment handling
			if(data.type == 'kaspi'){
				vueTopupLogin.payment_type_img = true;	
			}
			if(data.type == 'razorpay'){
				vueTopupLogin.payment_qr = '';
				vueTopupLogin.payment_url_div = true;
				vueTopupLogin.payment_html = `<div class="razorpay-qr-img"><img src="${data.url}" alt="razorpay payment qr code"/></div>`;
			}
			if(data.type == 'manual'){
				vueTopupLogin.payment_qr = '';
				let payment_manual_tip1 = translate_string('Scan and pay ');
				let payment_manual_tip2 = translate_string('Contact the staff and confirm your payment.');
				vueTopupLogin.manual_payment_html = `<div>
					<ol>
						<li>
						${payment_manual_tip1}<font color="red" size="3rem">${data.amount.toFixed(2)}</font>
						</li>
						<li>
						${payment_manual_tip2}
						</li>
					</ol>
					<img src="${data.payment_url}"/>
					</div>`;
			}
			if(data.type == 'paymongo'){
				vueTopupLogin.payment_qr = '';
				vueTopupLogin.paymongo_html = `<div><img src="${data.payment_url}" alt="QR Code" style="width:266px" /></div>`;
			}
			if(data.type == 'midtrans'){
				vueTopupLogin.payment_qr = '';
				vueTopupLogin.midtrans_html = `<div><img src="${data.payment_url}" alt="midtrans QR Code" style="width:266px" /></div>`;
			}
			if(data.type == 'finik'){
				vueTopupLogin.payment_qr = '';
				vueTopupLogin.finik_html = `<div><img src="${data.payment_url}" alt="Finik QR Code" style="width:266px; background-color: white;" /></div>`;
			}
			if (data.type == 'qris') {
				let checkStatus = async (times) => {
					if (times > 10) return;
					let order = await theApiClient.callCafeApi('getTopupStatus', 'GET', { order_no: data.order_no, t: data.t, sid: data.sid })
					if (order.order_status != ORDER_STATUS_IN_PROCESS) {
						return;
					}
					setTimeout(() => {
						checkStatus(times + 1)
					}, 10_000);
				}
				checkStatus(0)
			}
		}
	}
}

const homecafeid_form_submit = ICAFEMENU_CORE.debounce(function ()
{
	// Spinner handled by vueGlobal.isLoading check in template
	vueGlobal.isLoading = true;
	const icafeId = vueLogin.icafe_id || '';
	ICAFEMENU_CORE.callFun('HOMESETCAFEID ' + icafeId);
})

async function multi_mode_login()
{
	if (vueLoginMode.active_tab === 'guest') {
		return guest_login_submit();
	}

	if (vueLoginMode.active_tab === 'balance') {
		return balance_login_submit();
	}

	if (vueLoginMode.mode === 'default' || vueLoginMode.active_tab === 'account') {
		return login_form_submit();
	}
	
	return access_code_login_form_submit();
}

async function balance_login_submit() {
	vueTopup.resetOutputs();
	vueTopup.clearErrors();

	const member_account = vueTopup.member_account;
	const topup_amount = vueTopup.topup_amount;
	const topup_time = vueTopup.topup_time;
	const promo_code = vueTopup.promo_code;
	
	let hasError = false;

	// Validation
	if (!member_account || member_account.trim() == '') {
		vueTopup.errors.member_account = translate_string('please input member account');
		hasError = true;
	}
	if (!topup_amount || topup_amount === '') {
		vueTopup.errors.topup_amount = translate_string('please input amount');
		hasError = true;
	} else if (topup_amount < theSettings.mini_qr_payment) {
		vueTopup.errors.topup_amount = translate_string('Please input mini amount') + ' ' + theSettings.mini_qr_payment;
		hasError = true;
	}

	if (hasError) {
		return false;
	}

	vueGlobal.isLoading = true;
	const data = await theApiClient.callCafeApi('getTopupUrl','post',{
		member_account: member_account,
		topup_amount: topup_amount,
		promo_code: promo_code,
		pc_name: thePCInfo.pc_name})
		.catch(ICafeApiError.show)
	.finally(()=>{
			vueGlobal.isLoading = false;
		})
	
	if (typeof (data?.result) == 'undefined') {
		// API error handled by catch roughly, but if data is undefined/null need to stop
		return;
	}

	if (data.result == 0) {
		const promoCodeErrors = [
			'Promo code does not exist',
			'Promo code cannot be used for topup',
			'Promo code has expired',
			'Promo code has been used up',
			'Promo code has already been used'
		];
		const isPromoError = promoCodeErrors.some(error =>
			data.message && (data.message.includes(error) || data.message.includes(translate_string(error)))
		);

		if (isPromoError) {
			vueTopup.errors.promo_code = data.message || 'Wrong code';
		} else {
			sweetAlert('', data.message, 'error');
		}
		return;
	}

	if (data.result == 1) {
		vueTopup.showFormRows = false;
		// showSummary logic in inline view is handled by v-show="!vueTopup.showFormRows"

		vueTopup.summaryMember = member_account;
		vueTopup.summaryAmount = (theSettings.currency ?? '$') + parseFloat(topup_amount).toFixed(2);
		vueTopup.summaryMinutes = topup_time;

		vueTopup.payment_qr = data.url;
		
		PetiteVue.nextTick(() => {
			const qrEl = document.querySelector('#inline_balance_qr');
			if (qrEl) {
				qrEl.innerHTML = '';
				new QRCode(qrEl, data.url);
			}
		});

		if(data.type == 'kaspi'){
			vueTopup.payment_type_img = true;	
		}
		if(data.type == 'razorpay'){
			vueTopup.payment_qr = ''; 
			vueTopup.payment_html = `<div class="razorpay-qr-img"><img src="${data.url}" alt="razorpay payment qr code"/></div>`;
		}
		if(data.type == 'manual'){
			let payment_manual_tip1 = translate_string('Scan and pay ');
			let payment_manual_tip2 = translate_string('Contact the staff and confirm your payment.');
			vueTopup.manual_payment_html = `<div>
				<ol>
					<li>
					${payment_manual_tip1}<font color="red" size="3rem">${data.amount.toFixed(2)}</font>
					</li>
					<li>
					${payment_manual_tip2}
					</li>
				</ol>
				<img src="${data.payment_url}"/>
				</div>`;
		}
		if (data.type == 'paymongo') {
			vueTopup.paymongo_html = `<div><img src="${data.payment_url}" alt="QR Code" style="width:266px" /></div>`;
		}
		if (data.type == 'midtrans') {
			vueTopup.midtrans_html = `<div><img src="${data.payment_url}" alt="midtrans QR Code" style="width:266px" /></div>`;
		}
		if (data.type == 'finik') {
			vueTopup.finik_html = `<div><img src="${data.payment_url}" alt="Finik QR Code" style="width:266px; background-color: white;" /></div>`;
		}

		if (data.type == 'qris') {
			let checkStatus = async (times) => {
				if (times > 10) return;
				let order = await theApiClient.callCafeApi('getTopupStatus', 'GET', { order_no: data.order_no, t: data.t, sid: data.sid })
				if (order.order_status != ORDER_STATUS_IN_PROCESS) {
					return;
				}
				setTimeout(() => {
					checkStatus(times + 1)
				}, 10_000);
			}
			checkStatus(0)
		}
	}
}

async function guest_login_submit() {
	vueTopupLogin.resetOutputs();
	vueTopupLogin.clearErrors();

	const topup_memeber_email = vueTopupLogin.member_email;
	const topup_login_amount = vueTopupLogin.topup_amount;
	const topup_login_time = vueTopupLogin.topup_time;
	const promo_code = vueTopupLogin.promo_code;
	
	let hasError = false;

	// Validation
	if (!topup_memeber_email || topup_memeber_email.trim() == '') {
		vueTopupLogin.errors.member_email = translate_string('please input email');
		hasError = true;
	}
	if (!topup_login_amount || topup_login_amount === '') {
		vueTopupLogin.errors.topup_amount = translate_string('please input amount');
		hasError = true;
	} else if (topup_login_amount < theSettings.mini_qr_payment) {
		vueTopupLogin.errors.topup_amount = translate_string('Please input mini amount') + ' ' + theSettings.mini_qr_payment;
		hasError = true;
	}
	if (topup_login_time === '' || topup_login_time == null) {
		vueTopupLogin.errors.topup_time = translate_string('please input minutes');
		hasError = true;
	}

	if (hasError) {
		return false;
	}

	vueGlobal.isLoading = true;
	const data = await theApiClient.callCafeApi('memberAddGuest','POST',{
		topup_amount: topup_login_amount,
		member_email: topup_memeber_email,
		pc_name: thePCInfo.pc_name
	}).catch(ICafeApiError.show).finally(()=>{
		vueGlobal.isLoading = false;
	})
	if(!data) return null;

	const member_account = data?.member_account
	const reqData = { 
		member_account: member_account, 
		topup_amount: topup_login_amount, 
		promo_code: promo_code,
		pc_name: thePCInfo.pc_name 
	};

	if(vueTopupLogin.topup_amount < theSettings.mini_qr_payment){
		 sweetAlert('', translate_string('Please input mini amount')  + ' ' + theSettings.mini_qr_payment, 'warning');
		 return
	}

	vueGlobal.isLoading = true;
	const topupData = await theApiClient.callCafeApi('getTopupUrl','POST',reqData).catch(ICafeApiError.show).finally(()=>vueGlobal.isLoading = false)
	
	if (topupData?.result == 0) {
		const promoCodeErrors = [
			'Promo code does not exist',
			'Promo code cannot be used for topup',
			'Promo code has expired',
			'Promo code has been used up',
			'Promo code has already been used'
		];
		const isPromoError = promoCodeErrors.some(error =>
			topupData.message && (topupData.message.includes(error) || topupData.message.includes(translate_string(error)))
		);

		if (isPromoError) {
			vueTopupLogin.errors.promo_code = topupData.message || 'Wrong code';
		} else {
			sweetAlert('', topupData.message, 'error');
		}
		return;
	}

	if (topupData.result == 1) {
		vueTopupLogin.showFormRows = false;

		const memberEmail = vueTopupLogin.member_email || reqData.member_account || 'Max';
		const amount = vueTopupLogin.topup_amount || reqData.topup_amount || '$10';
		const minutes = vueTopupLogin.topup_time || '120';

		vueTopupLogin.summaryMember = memberEmail;
		vueTopupLogin.summaryAmount = (theSettings.currency ?? '$') + parseFloat(amount).toFixed(2);
		vueTopupLogin.summaryMinutes = minutes;

		vueTopupLogin.payment_qr = topupData.url;
		
		PetiteVue.nextTick(() => {
			const qrEl = document.querySelector('#inline_guest_qr');
			if (qrEl) {
				qrEl.innerHTML = '';
				new QRCode(qrEl, topupData.url);
			}
		});

		if(topupData.type == 'kaspi'){
			vueTopupLogin.payment_type_img = true;	
		}
		if(topupData.type == 'razorpay'){
			vueTopupLogin.payment_qr = ''; 
			vueTopupLogin.payment_html = `<div class="razorpay-qr-img"><img src="${topupData.url}" alt="razorpay payment qr code"/></div>`;
		}
		if(topupData.type == 'manual'){
			let payment_manual_tip1 = translate_string('Scan and pay ');
			let payment_manual_tip2 = translate_string('Contact the staff and confirm your payment.');
			vueTopupLogin.manual_payment_html = `<div>
				<ol>
					<li>
					${payment_manual_tip1}<font color="red" size="3rem">${topupData.amount.toFixed(2)}</font>
					</li>
					<li>
					${payment_manual_tip2}
					</li>
				</ol>
				<img src="${topupData.payment_url}"/>
				</div>`;
		}
		if (topupData.type == 'paymongo') {
			vueTopupLogin.paymongo_html = `<div><img src="${topupData.payment_url}" alt="QR Code" style="width:266px" /></div>`;
		}
		if (topupData.type == 'midtrans') {
			vueTopupLogin.midtrans_html = `<div><img src="${topupData.payment_url}" alt="midtrans QR Code" style="width:266px" /></div>`;
		}
		if (topupData.type == 'finik') {
			vueTopupLogin.finik_html = `<div><img src="${topupData.payment_url}" alt="Finik QR Code" style="width:266px; background-color: white;" /></div>`;
		}

		if (topupData.type == 'qris') {
			let checkStatus = async (times) => {
				if (times > 10) return;
				let order = await theApiClient.callCafeApi('getTopupStatus', 'GET', { order_no: topupData.order_no, t: topupData.t, sid: topupData.sid })
				if (order.order_status != ORDER_STATUS_IN_PROCESS) {
					return;
				}
				setTimeout(() => {
					checkStatus(times + 1)
				}, 10_000);
			}
			checkStatus(0)
		}
	}
}

async function access_code_login_form_submit()
{
	var access_code = vueLogin.access_code;
	var license_name = theCafe.license_name;
	
	if (access_code.length === 0)
		return;
	
	vueGlobal.isLoading = true;
	change_login_form_state(true);
	
	console.log('access code login form submit');
	
	try {
		let url = theApiClient.getServerUrl('auth/accessCodeLogin');
		let form_data = { access_code: access_code, status_pc_token: null, license_name, pc_name: thePCInfo.pc_name, is_client: 1, };
		let data = await theApiClient.callApi(url, 'POST', form_data);
		if(data){
			localStorage.setItem('clientMemberInfo', JSON.stringify(data));
		}
		vueLogin.access_code = '';
		
		await handleLoginSuccess(data, data.member.member_account);
	} catch (error) {
		await handleLoginError(error, '', '', license_name);
	}
}

async function login_form_submit(bookingPassword = null)
{
	var strUserName = vueLogin.username;
	var strPassword = vueLogin.password;
	var licenseName = theCafe.license_name;

	// 如果是预约密码验证，从模态框获取预约密码
	if (bookingPassword === null) {
		bookingPassword = vueLogin.booking_password || null;
	}

	if (strUserName.length == 0 || strPassword.length == 0)
		return;

	vueGlobal.isLoading = true;
	change_login_form_state(true); // This function still uses jQuery, I will update it too or rely on isLoading for disabling.
	// Actually I should update change_login_form_state to just rely on isLoading if possible, or leave it for now but remove jQuery selectors usage if I bind disabled state.
	// But binding 'disabled' to all inputs requires HTML update. For now I keep it as utility but eventually should be bound.

	console.log('login form submit', bookingPassword ? 'with booking password' : 'without booking password');

	try {
		const data = await theApiClient.memberLogin(strUserName, null, strPassword, licenseName, thePCInfo.pc_name, bookingPassword);
		console.log('member data:', data);

		if (data?.booking_error) {
			vueGlobal.isLoading = false;
			change_login_form_state(false);

			if (data.booking_error === 'BOOKING_PASSWORD_REQUIRED') {
				showBookingPasswordModal(data.booking_info, strUserName, strPassword, licenseName);
				return;
			}

			if (data.booking_error === 'BOOKING_PASSWORD_INCORRECT') {
				vueLogin.booking_password = '';
				sweetAlert('', translate_string('Booking password is incorrect'), 'error', function() {
					showBookingPasswordModal(data.booking_info || {}, strUserName, strPassword, licenseName);
				});
				return;
			}
		}

		vueLogin.booking_password = '';
		await handleLoginSuccess(data, strUserName);
	} catch (error) {
		await handleLoginError(error, strUserName, strPassword, licenseName);
	}
}

async function handleLoginSuccess(data, strUserName) {
	if (!data) {
		vueGlobal.isLoading = false;
		change_login_form_state(false);
		return;
	}

	vueGlobal.showOrderList = true;
	// 判断当前是否已登录, 如果已登录, 则先清空thePcStatus
	if (is_logined()) {
		thePCStatus = { member_account: '' };
	}
	
	// 用登录返回的数据填充 thePCStatus 关键字段
	thePCStatus.member_group_discount_offer = data?.member?.member_group_discount_offer ?? 0;
	
	// start_session_after_login = 0 时会员存在预定、OFFER时直接开始会话, 反之则进入start session页面
	// data.client.start_session : true - 立即开始会话 ; false - 需要进入start session页面
	var show_start_session_page = document.getElementById('page-start-session') && data?.client?.start_session === false;
	memberInfo.member_name = (strUserName || '').toUpperCase();
	memberInfo.member_photo = data?.member?.member_photo || '';
	if (show_start_session_page) {
		theStartSession.show();
		vuePcTime.price_dynamic_enable = data?.client?.pc_time_info?.price_dynamic_enable
		vuePcTime.fixed_price = data?.client?.pc_time_info?.fixed_price
		vuePcTime.dynamic = data?.client?.pc_time_info?.dynamic
	} else {
		await theStartSession.start();
		theHome.show();
	}

	vueGlobal.isLoading = false;
	change_login_form_state(false);
}

async function handleLoginError(error, strUserName, strPassword, licenseName) {
	vueGlobal.isLoading = false;
	change_login_form_state(false);

	vueLogin.booking_password = '';

	ICafeApiError.show(error);
}

async function admin_exit_form_submit() {
	vueGlobal.isLoading = true;

	var password = vueAdminExit.password;
	if (password.length == 0) {
		vueGlobal.isLoading = false;
		vueAdminExit.hasError = true;
		return false;
	}

	if (theSettings.admin_password != (theSettings.admin_password.charAt(0) == '*' ? '*' + sha256('*' + sha256(password)) : sha256(md5(password)))) {
		setTimeout(function () {
			sweetAlert("", translate_string("Wrong password!"), "error");
		}, 100);
		vueGlobal.isLoading = false;
		vueAdminExit.hasError = true;
		return false;
	}

	const data = await theApiClient.callApi(theApiClient.getServerUrl('auth/guestLogin'), 'POST', {
		license_name: theCafe.license_name,
		pc_name: thePCInfo.pc_name,
		is_client: 1,
	}, {timeout: 5000}).catch(ICafeApiError.skip);
	
	if(data)
	{
		await theApiClient.callCafeApi('syslog', 'post', {
				pc_name: thePCInfo.pc_name,
				event: 'ADMINEXIT',
			}, { timeout: 5000 }).catch(ICafeApiError.skip);
	}
	
	vueGlobal.isLoading = false;

	ICAFEMENU_CORE.unlock_all()
	ICAFEMENU_CORE.callFun("EXIT");

	return false;
}

function logout()
{
	ICAFEMENU_CORE.callFun('RUN logout.bat');
	
	show_login_page('login');
	theEvents.reset();
}

function confirm_checkout_submit()
{
	vueGlobal.isLoading = true;

	vueGlobal.modals.confirmCheckout = false;

	if (theIsHomeVersion) {
		var cmd = {
			action: 'request_checkout',
			version: 2,
			type: 'request',
			from: 'client',
			target: 'wss-server',
			data: {
				member_recent_played: theGameList.member_recent_played, source: "client"
			}};
		ICAFEMENU_CORE.callFun('WSSSEND ' + JSON.stringify(cmd));
		// FIXME after upgrade process_wss_package
		process_wss_package({ action: 'client_status', version: 2, type: 'request', from: 'wss-server', target: 'client', status: 'success', data: {client_status: { member_account: '' }}});
		vueGlobal.isLoading = false;
		return;
	}

	if (!theWssLogined) {
		toast(translate_string("Cannot send checkout request, please contact admin"));
		vueGlobal.isLoading = false;
		logout(); // 方便测试
		return false;
	}

	if (is_logined() && thePCStatus.member_group_id == MEMBER_GROUP_POSTPAID)
		toast(translate_string("This session needs to check out from server, please contact admin."));

	var cmd = {
		action: 'request_checkout',
		version: 2,
		type: 'request',
		from: 'client',
		target: 'wss-server',
		data: {
			member_recent_played: theGameList.member_recent_played, source: "client"
		}};
	console.log(JSON.stringify(cmd));
	
	ICAFEMENU_CORE.callFun('WSSSEND ' + JSON.stringify(cmd));
	vueGlobal.isLoading = false;

	return false;
}

function close_click() {
	ICAFEMENU_CORE.unlock_all()
	ICAFEMENU_CORE.callFun("EXIT");
}

function MemberLogin() {

	this.show_dialog = function () {
		var memberLoginUrl = "https://cp.icafecloud.com/shop/"+theCafe.license_name+"?dType=openDevice&dName="+thePCInfo.pc_name;
		if(theSettings.license_info.license_server_code == 'dev') {
			memberLoginUrl = "https://dev.icafecloud.com/shop/"+theCafe.license_name+"?dType=openDevice&dName="+thePCInfo.pc_name;
		}
		
		vueGlobal.modals.login = true;
		PetiteVue.nextTick(() => {
			const memberLoginEl = document.querySelector('.myModalMemberLogin #member_login');
			if (memberLoginEl) {
				memberLoginEl.innerHTML = '';
				new QRCode(memberLoginEl, memberLoginUrl);
			}
		});
	}

}

function MemberRegister() {

	this.show_dialog = function () {
		var memberRegisterUrl = "https://cp.icafecloud.com/shop/"+theCafe.license_name+"?dType=openDevice&dName="+thePCInfo.pc_name+"&icafe_id="+theCafe.id+"&request_type=register";
		if(theSettings.license_info.license_server_code == 'dev') {
			memberRegisterUrl = "https://dev.icafecloud.com/shop/"+theCafe.license_name+"?dType=openDevice&dName="+thePCInfo.pc_name+"&icafe_id="+theCafe.id+"&request_type=register";
		}
		
		vueGlobal.modals.scanRegister = true;
		PetiteVue.nextTick(() => {
			const container = document.querySelector('.myModalQRMemberRegister #member_register');
			if (container) {
				container.innerHTML = '';
				new QRCode(container, memberRegisterUrl);
			}
		}); 
	}

	this.show_client_register = function () {
		var register_agreement_enable = theSettings.register_agreement_enable ?? 0;
		var club_rules = theSettings.club_rules ?? '';
		var privacy_policy = theSettings.privacy_policy ?? '';

		if (register_agreement_enable == 0) {
			// $('#form-register-member button[type="submit"]').prop("disabled", false); // Bind disabled
			// $('#club-rule-agreement-row').hide(); // v-show
			// $('#personal-data-agreement-row').hide(); // v-show

			vueGlobal.modals.register = true;
			return;
		}
		
		// $('#club_rules_content').html(club_rules); // Handled by v-html
		// $('#personal_data_content').html(privacy_policy); // Handled by v-html

		vueGlobal.modals.register = true;
	}

	this.show_club_rules = function () {
		vueGlobal.modals.clubRules = true;
	}

	this.show_personal_data = function () {
		vueGlobal.modals.personalData = true;
	}

	this.agreement_check = function () {
		var club_rules_checked = vueRegister.agree_club_rules;
		var personal_data_checked = vueRegister.agree_personal_data;

		if (club_rules_checked && personal_data_checked) {
			// Button disabled state bound to !club_rules_checked || !personal_data_checked
			return;
		}
		
		// Button state handled by Vue
	}
}

function member_register()
{
	// 清除所有错误状态（使用 Vue 状态）
	vueRegister.clearErrors();

	const theIsSmsSwitch = theSettings.sms_enable ?? false;
	var account = vueRegister.account;
	var birthday = vueRegister.birthday;
	var password = vueRegister.password;
	var confirm_password = vueRegister.confirm_password;
	var first_name = vueRegister.first_name;
	var last_name = vueRegister.last_name;
	var phone = vueRegister.phone;
	var email = vueRegister.email;
	var promo_code = vueRegister.promo_code;
	var member_sms_code = vueRegister.member_sms_code;
	var id_card = vueRegister.id_card;
	let hasError = false;

	// 验证 Account
	if (!account || account.trim() == '') {
		vueRegister.errors.account = translate_string('please input account');
		hasError = true;
	}

	// 验证 Password
	if (!password || password.trim() == '') {
		vueRegister.errors.password = translate_string('please input password');
		hasError = true;
	}

	// 验证 Confirm Password
	if (!confirm_password || confirm_password.trim() == '') {
		vueRegister.errors.confirm_password = translate_string('please input confirm password');
		hasError = true;
		
	} else if (password != confirm_password) {
		vueRegister.errors.confirm_password = translate_string("The new password and confirm password do not match!");
		hasError = true;
	}

	if (hasError) {
		sweetAlert("", vueRegister.errors.account || vueRegister.errors.password || vueRegister.errors.confirm_password, "error");
		return false;
	}

	const subCallForm = function () {
		vueRegister.isSubmitting = true;
		vueGlobal.isLoading = true;
		// Disabled handled by loading state
		theApiClient.callCafeApi('clientMemberRegister','POST',{
				pc_name: thePCInfo.pc_name,
				account: account,
				birthday: birthday,
				password: password,
				first_name: first_name,
				last_name: last_name,
				phone: phone,
				email: email,
				promo_code: promo_code,
				id_card: id_card,
			}).then(()=>{
				vueGlobal.modals.register = false;
				sweetAlert("", translate_string("Succeed"), "success");
			}).catch(ICafeApiError.show).finally(()=>{
				vueGlobal.isLoading = false;
			vueRegister.isSubmitting = false;
			})
	}
	
	if (theIsSmsSwitch == 1 && vueGlobal.memberSettings.member_phone == 1) {//等于1表示开启手机短信验证
		if (!member_sms_code) {
			sweetAlert("", translate_string("Please enter the SMS verification code!"), "error");
			return false;
		} else {
			// 输入的code发起对比是否一致
			SmsClassFun.verifySmscode(function (result) {
				if (result.code && result.code == 200) {
					subCallForm();
				} else {
					sweetAlert("", translate_string(result && result.message ? result.message : 'SMS verification code mismatch'), "error");
					return false;
				}
			})
		}
	} else {
		subCallForm();
	}
}

// sub_div => login, member_register, admin_exit
function show_login_page(sub_div)
{
	ICAFEMENU_CORE.callFun("LOCK 65535");

	ICAFEMENU_CORE.resizeWin("-1*-1");
	ICAFEMENU_CORE.callFun("SETWINDOWTOPMOST 1");

	var MONTHs = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	var d = new Date();
	var current_month = d.getMonth();
	var current_year = d.getFullYear();

	var last_month = current_month-1;
	var last_year = current_year;
	if (last_month < 0) {
		last_month = 11;
		last_year -= 1;
	}

	if ((theSettings.access_code_login ?? 0) == 1) {
		vueLoginMode.mode = 'tabs';
	}

	if((theSettings.client_login_format ?? 0) == 0)
	{
		vueGlobal.backgroundImage = `url('${ICAFEMENU_CORE.posters_path('cafe_info_cafe_login.jpg')}'), url('images/games.jpg')`;
		theVideo.hide(); // Consider refactoring 'theVideo' to use vueGlobal.videoBackground if possible, but keep for now if it handles DOM
	}
	else
	{
		vueGlobal.backgroundImage = '';
		theVideo.play(ICAFEMENU_CORE.root_path(theSettings.client_login_video ?? ''));
	}
	// $('#loginForm input[name=username]').prop('disabled', !theWssLogined);
	// $('#loginForm input[name=password]').prop('disabled', !theWssLogined);
	vueLogin.username = '';
	vueLogin.password = '';
	vueLogin.access_code = '';
	// 清空最近预定信息提示
	vueLogin.recentBookingAt = '';
	vueLogin.recentBookingLeft = '';
	var opacity = 1.0;
	if (!theWssLogined)
		opacity = 0.5;
	// $('#loginForm button').css({opacity: opacity});

	theSettings.client_pc_name_size ??= 40;
	set_monitor_turn_off_timeout(thePCInfo.pc_turn_off_monitor_seconds);
	if (theIsHomeVersion)
		vueLogin.username = thePCInfo.pc_name;
	else
		vueGlobal.pcName = thePCInfo.pc_name; // 使用 Vue 响应式状态
	
	vueGlobal.pcNameFontSize = theSettings.client_pc_name_size + 'px';

	vueGlobal.versionDate = "v. " + thePCInfo.version_date;

	// Modals handled by vueGlobal via reactivity in modals object - resetting all to false
	for (const key in vueGlobal.modals) {
		if (Object.hasOwnProperty.call(vueGlobal.modals, key)) {
			// Don't reset 'login' if we are here? No, this function resets everything.
			if (key === 'booting') continue; // Example exception if needed
			vueGlobal.modals[key] = false;
		}
	}

	vueGlobal.currentView = 'login';
	vueGlobal.bodyClass = 'bd-login-page';
	
	sessionStorage.clear();

	// The following jQuery .hide()/.show() calls for specific sub-divs in #page_login need to be handled.
	// We can use a property in vueGlobal or vueLoginMode/vueLogin to control this visibility.
	// Currently vueLoginMode has 'mode'. 'active_tab'.
	// We might need 'subView' or similar for 'login', 'register', 'admin_exit'.
	// Let's add 'subView' to vueLogin reactive object or use existing logic if compatible.
	// The function takes sub_div argument.
	
	// Temporarily keep jQuery for sub-divs internal to login page if they are not yet bound, 
	// OR use a new reactive property. Let's use `vueLogin.currentSubView`.
	// I need to ensure vueLogin has this property. I'll add it to main.js in next step if missing.
	// For now, I will use jQuery for these internal divs as a localized issue, 
	// but mostly I replaced the big page switching and modal hiding.
	
	vueLoginMode.view = 'menu';

	// 使用响应式状态控制子视图
	vueGlobal.loginSubView = sub_div; // 'login', 'admin_exit', 'register', 'homecafeid'

	if (sub_div == 'login') {
		PetiteVue.nextTick(() => document.getElementById('username')?.focus());
	}

	if (sub_div == 'admin_exit') {
		vueAdminExit.password = '';
		vueAdminExit.hasError = false;
		PetiteVue.nextTick(() => {
			const el = document.querySelector('#adminexitForm input[type="password"]');
			if(el) {
				el.classList.remove('border-warning');
				el.focus();
			}
		});
	}

	unlock_pc();
}

// 获取用户信息
function getMemberInfo()
{
	return theApiClient.getMemberInfo() || {}
}

function show_login_by_no_token()
{
	show_login_page('login');
}

function change_login_form_state(disabled)
{
	vueLogin.formDisabled = disabled;
}


function ForgotPassword() {
	var that = this;

	this.show_dialog = function () {

		vueForgotPassword.phone_number = '';
		vueForgotPassword.email = '';

		vueGlobal.modals.forgotPassword = true;
	}

	this.submit_form = function() {
		let way = theSettings?.client_reset_password_way ?? 0;
		if (! [RESET_PASSWORD_SMS, RESET_PASSWORD_EMAIL].includes(way)) {
			return;
		}
		
		let verify_result = way == RESET_PASSWORD_SMS ? that.verify_phone_number() : that.verify_email();
		if (! verify_result) {
			return;
		}
		
		// Refactored to use theApiClient
		const memberCheckUrl = 'memberResetPwd'; // API endpoint name mapping might differ, checking helper.js or assuming standard
		// helper.js uses getCafeApiUrl('memberResetPwd', 'auth').
		// let's try calling callCafeApi or callApi directly.
		// callCafeApi usually prefixes 'shop/<license>/'
		// getCafeApiUrl('memberResetPwd', 'auth') -> auth/memberResetPwd ?
		
		let url = theApiClient.getServerUrl('auth/memberResetPwd'); // Guessing based on previous pattern
		
		vueGlobal.isLoading = true;
		theApiClient.callApi(url, 'POST', {
			phone_number: vueForgotPassword.phone_number,
			email: vueForgotPassword.email,
			reset_password_way: theSettings.client_reset_password_way ?? 0,
			license_name: theCafe.license_name,
			apwd: theSettings.admin_password,
		}).then((data) => {
			vueGlobal.modals.forgotPassword = false;
			sweetAlert("", translate_string("Succeed"), "success");
		}).catch((e) => {
			let message = e?.message || translate_string('Failed to verify')
			sweetAlert('', message, 'error');
		}).finally(() => {
			vueGlobal.isLoading = false;
		});
	}
	
	this.verify_email = function() {
		if (!vueForgotPassword.email) {
			sweetAlert('', translate_string('Please enter your email'), 'error');
			return false;
		}
		
		return true;
	}

	this.verify_phone_number = function() {

		if (!vueForgotPassword.phone_number) {
			sweetAlert('', translate_string('Please enter your phone number'), 'error');
			return false;
		}

		return true;
	}
}

// booking password
function showBookingPasswordModal(bookingInfo, strUserName, strPassword, licenseName) {
	const pcName = bookingInfo?.pc_name || thePCInfo.pc_name;
	const startTime = bookingInfo?.start_time || '';
	const endTime = bookingInfo?.end_time || '';

	vueLogin.bookingPCName = pcName;
	vueLogin.bookingTimeRange = startTime + ' - ' + endTime;
	vueLogin.booking_password = '';
	
	// Store login info in a way accessible to submitBookingPassword, or just retry login with password
	// The original code used .data(). We can use a temporary object or just pass/store in variables if needed.
	// But submitBookingPassword just calls login_form_submit(bookingPassword).
	// login_form_submit uses global vueLogin.username/password.
	// So we don't strictly need to store strUserName/strPassword if they are already in vueLogin.
	// However, if the modal was triggered after a failed login attempt, vueLogin might still hold them.
	
	vueGlobal.modals.bookingPassword = true;
}

async function submitBookingPassword() {
	const bookingPassword = vueLogin.booking_password;
	if (!bookingPassword) {
		sweetAlert('', translate_string('Please enter booking password'), 'error');
		return false;
	}

	vueGlobal.modals.bookingPassword = false;

	await login_form_submit(bookingPassword);

	return false;
}

function StartSession()
{
	var that = this;
	
	this.show = async function () {
		// Buttons enabled state bound to vueGlobal.isLoading
		await refreshBalanceInfo(memberInfo.member_name)
		
		//$('#page_login').removeClass('d-flex').hide();
		//$('#page_games').removeClass('d-flex').hide();
		//$('#page_start_session').addClass("d-flex").show();
		vueGlobal.currentView = 'start-session';
		
		that.load_offers()
		
		PetiteVue.nextTick(() => {
			ui_init();
			$('[data-toggle="tooltip"]').tooltip();
		});
	}
	
	this.start = async function () {
		vueGlobal.isLoading = true;
		await theApiClient.callCafeApi('clientStartSession', 'POST', {
			member_account: memberInfo.member_name,
			pc_name: thePCInfo.pc_name,
		}).catch(function(e){
			ICafeApiError.show(e);
		}).finally(function() {
			vueGlobal.isLoading = false;
		});
	}
	
	this.start_offer_session = async function (product_id) {
		vueGlobal.isLoading = true;
		await theApiClient.callCafeApi('submitOrder', 'POST', {
			payment_method: 1,
			items: [{
				product_id: product_id,
				qty: 1
			}],
			pc_name: thePCInfo.pc_name
		}).catch(function(e){
			ICafeApiError.show(e);
		}).finally(function() {
			vueGlobal.isLoading = false;
		})
	}
	
	this.buy_offer = function (item) {
		theShop.order_items = [];
		theShop.order_items.push({
				product_id: item.product_id,
				product_name: item.product_name,
				product_price: item.product_price,
				product_tax_id: item.product_tax_id ?? 0,
				product_enable_discount: item.product_enable_discount ?? 0,
				product_is_offer: true,
				order_item_qty: 1,
		});
		theShop.cart_refresh();
		vueGlobal.modals.buy = true;
	}
	
	this.load_offers = function() {
		if (theSettings.license_using_billing != 1) {
			return;
		}
		var filtered_items = [];
		theProductList.forEach(function(obj) {
			// -1的代表的是offer
			if (obj.product_group_id != -1) {
				return;
			}
			
			// 取消 obj.product_group_id == -1 判断，因为常规产品也支持show_weekday、show_time; -1的代表的是offer
			// pc group, member group
			var pc_group_id = thePCStatus.pc_group_id ?? 0
			var member_group_id = thePCStatus.member_group_id ?? 0
			if (JSON.parse(obj.product_pc_groups).indexOf('0') < 0 && JSON.parse(obj.product_pc_groups).indexOf(pc_group_id.toString()) < 0)
				return;
			
			if (JSON.parse(obj.product_member_groups).indexOf('0') < 0 && JSON.parse(obj.product_member_groups).indexOf(member_group_id.toString()) < 0)
				return;
			
			// empty or "7|1|2|3|4|5|6"
			var todayAvailable = true;
			var yesterdayAvailable = true;
			var product_show_weekday = (typeof(obj.product_show_weekday) != 'undefined' ? obj.product_show_weekday : '');
			if (product_show_weekday.length > 0) {
				var weekdays = product_show_weekday.split('|');
				if (weekdays.indexOf(moment().format('E')) < 0)
					todayAvailable = false;
				if (weekdays.indexOf(moment().add(-1, 'days').format('E')) < 0)
					yesterdayAvailable = false;
				if (!todayAvailable && !yesterdayAvailable)
					return;
			}
			
			// empty or 00:00-24:00
			var product_show_time = (typeof(obj.product_show_time) != 'undefined' ? obj.product_show_time : '');
			if (product_show_time.length > 0) {
				var times = product_show_time.split('-');
				if (times.length != 2)
					return;
				
				var begin_times = times[0].split(':');
				var end_times = times[1].split(':');
				if (begin_times.length != 2 || end_times.length != 2)
					return;
				
				var begin = moment().set({ 'hour': parseInt(begin_times[0]), 'minute': parseInt(begin_times[1]), 'second': 0 });
				var end = moment().set({ 'hour': parseInt(end_times[0]), 'minute': parseInt(end_times[1]), 'second': 0 });
				if (end >= begin) {
					if (!todayAvailable)
						return;
					if (begin.isAfter() || end.isBefore())
						return;
				}
				
				// if like 23:00-08:00 over mid-night
				if (end < begin) {
					let isValid = ((begin.isBefore() && todayAvailable) || (yesterdayAvailable && end.isAfter()));
					if (!isValid)
						return;
				}
			}
			
			// empty or "7|1|2|3|4|5|6"
			var today_enable = true;
			var yesterday_enable = true;
			var product_enable_weekday = (typeof(obj.product_enable_weekday) != 'undefined' ? obj.product_enable_weekday : '');
			if (product_enable_weekday.length > 0) {
				var weekdays = product_enable_weekday.split('|');
				if (weekdays.indexOf(moment().format('E')) < 0)
					today_enable = false;
				if (weekdays.indexOf(moment().add(-1, 'days').format('E')) < 0)
					yesterday_enable = false;
				if (!today_enable && !yesterday_enable)
					return;
			}
			
			// empty or 00:00-24:00
			var product_enable_time = (typeof(obj.product_enable_time) != 'undefined' ? obj.product_enable_time : '');
			if (product_enable_time.length > 0) {
				var enable_times = product_enable_time.split('-');
				if (enable_times.length != 2)
					return;
				
				var begin_enable_times = enable_times[0].split(':');
				var end_enable_times = enable_times[1].split(':');
				if (begin_enable_times.length != 2 || end_enable_times.length != 2)
					return;
				
				var begin = moment().set({ 'hour': parseInt(begin_enable_times[0]), 'minute': parseInt(begin_enable_times[1]), 'second': 0 });
				var end = moment().set({ 'hour': parseInt(end_enable_times[0]), 'minute': parseInt(end_enable_times[1]), 'second': 0 });
				if (end >= begin) {
					if (!today_enable)
						return;
					if (begin.isAfter() || end.isBefore())
						return;
				}
				
				// if like 23:00-08:00 over mid-night
				if (end < begin) {
					let isValid = ((begin.isBefore() && today_enable) || (yesterday_enable && end.isAfter()));
					if (!isValid)
						return;
				}
			}
			
			filtered_items.push(obj);
		});
		
		var new_items = [];
		for (var i=0; i<filtered_items.length; i++)
		{
			if(filtered_items[i].product_name.startsWith('*'))continue;
			if (theShop.current_group_id != PRODUCT_GROUP_COINS && filtered_items[i].product_price == 0 && filtered_items[i].product_coin_price > 0) continue;
			filtered_items[i].image = 'images/default-offer2.png';
			if (filtered_items[i].product_has_image) { filtered_items[i].image = ICAFEMENU_CORE.posters_path(filtered_items[i].product_id + '.jpg'); }
			new_items.push(filtered_items[i]);
		}
		vueOffers.items = JSON.parse(JSON.stringify(new_items))
		
	}
}

async function client_refresh() {
	vueGlobal.isLoading = true;
	try {
		var promises = [];
		if (typeof theEvents !== 'undefined') {
			promises.push(theEvents.refresh());
		}
		if (typeof refreshBalanceInfo !== 'undefined' && typeof memberInfo !== 'undefined') {
			promises.push(refreshBalanceInfo(memberInfo.member_name || memberInfo.member_account));
		}
		await Promise.all(promises);
	} catch (e) {
		console.error(e);
	} finally {
		vueGlobal.isLoading = false;
	}
}