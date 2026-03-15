function get_payment_method_string(method) {
	if(method == PAY_METHOD_CASH || method == PAY_METHOD_CASH_FOR_OFFER || method == PAY_METHOD_CASH_FOR_PC_TIME || method == PAY_METHOD_CASH_FOR_BOOKING)
		return translate_string('Cash');
	if(method == PAY_METHOD_CARD || method == PAY_METHOD_CARD_FOR_OFFER || method == PAY_METHOD_CARD_FOR_PC_TIME || method == PAY_METHOD_CARD_FOR_BOOKING)
		return translate_string('Credit card');
	if(method == PAY_METHOD_BALANCE || method == PAY_METHOD_BALANCE_FOR_OFFER || method == PAY_METHOD_BALANCE_FOR_PC_TIME || method == PAY_METHOD_BALANCE_FOR_BOOKING)
		return translate_string('Balance');
	if(method == PAY_METHOD_COIN || method == PAY_METHOD_COIN_FOR_OFFER)
		return translate_string('Coin');
	if(method == PAY_METHOD_QR_FOR_PC_TIME || method == PAY_METHOD_QR || method == PAY_METHOD_QR_FOR_OFFER)
		return translate_string('QR');
}

function getPaymentMethod(method) {
	if(get_payment_method_string(method)?.length > 0)
		return get_payment_method_string(method);
	return translate_string('Cash');
}

function checklist() {
	theApiClient.callCafeApi('memberChecklist', 'GET').then(res => {
		vueChecklistInfo.orders = res?.orders || [];
		vueChecklistInfo.member = res?.member || {};
		vueChecklistInfo.pc = res?.pc || {};
		
		
		vueGlobal.modals.checklist = true;
	}).catch(ICafeApiError.skip)
}

async function refresh_order_list()
{
	var payload = {
		sort_name: order_filter_params.sort_name,
		sort: order_filter_params.sort,
		search_text: order_filter_params?.search_text??"",
		page: order_filter_params.paging_info.page,
		t: Math.random()
	}

	const data = await theApiClient.callCafeApi('memberOrders', 'get', payload).catch(ICafeApiError.skip)
	if (!data) return;
	order_filter_params.paging_info = data.paging_info;
	vueOrderList.items = JSON.parse(JSON.stringify(data.orders))
	vueOrderList.items = vueOrderList.items?.map(item=>{
		let method = item.order_payment_method
		let status = item.order_status
		let isQRPayment = method == PAY_METHOD_QR_FOR_PC_TIME || method == PAY_METHOD_QR || method == PAY_METHOD_QR_FOR_OFFER;
		let isPendding = status == ORDER_STATUS_PENDING || status == ORDER_STATUS_IN_PROCESS
		let canQRPay = isQRPayment && isPendding
		return {...item,canQRPay}
	})
	vueOrderList.paging_info = JSON.parse(JSON.stringify(data.paging_info))
}

function order_page_first() {
	order_filter_params.paging_info.page = 1;
	refresh_order_list();
}

function order_page_previous() {
	if (order_filter_params.paging_info.page > 1)
		order_filter_params.paging_info.page --;
	refresh_order_list();
}

function order_page_next() {
	if (order_filter_params.paging_info.page < order_filter_params.paging_info.pages)
		order_filter_params.paging_info.page ++;
	refresh_order_list();
}

function order_page_last(){
	order_filter_params.paging_info.page = order_filter_params.paging_info.pages;
	refresh_order_list();
}

function order_page_go(index) {
	order_filter_params.paging_info.page = index;
	refresh_order_list();
}

function order_search_post() {
	order_filter_params.search_text = vueLayout.orderSearch;
	order_filter_params.paging_info.page = 1;
	refresh_order_list();
	return false;
}

function customer_order_list()
{
	 refresh_order_list();
	 vueGlobal.modals.orderList = true;
}

function customer_balance_history()
{
	refresh_balance_history();
	vueGlobal.modals.balanceHistory = true;
}

async function refresh_balance_history()
{
	var payload = {
		page: balanceHistoryFilterParams.paging_info.page,
		t: Math.random()
	}
	const data = await theApiClient.callCafeApi('memberBalanceHistory','get',payload).catch(ICafeApiError.skip)
	if(!data)return;
	balanceHistoryFilterParams.paging_info = data.paging_info;
	vueBalanceHistory.items = JSON.parse(JSON.stringify(data.items))
	vueBalanceHistory.paging_info = JSON.parse(JSON.stringify(data.paging_info))
	vueBalanceHistory.summary = JSON.parse(JSON.stringify(data.summary))
}

function balance_history_page_first() {
	balanceHistoryFilterParams.paging_info.page = 1;
	refresh_balance_history();
}

function balance_history_page_previous() {
	if (balanceHistoryFilterParams.paging_info.page > 1)
		balanceHistoryFilterParams.paging_info.page --;
	refresh_balance_history();
}

function balance_history_page_next() {
	if (balanceHistoryFilterParams.paging_info.page < balanceHistoryFilterParams.paging_info.pages)
		balanceHistoryFilterParams.paging_info.page ++;
	refresh_balance_history();
}

function balance_history_page_last(){
	balanceHistoryFilterParams.paging_info.page = balanceHistoryFilterParams.paging_info.pages;
	refresh_balance_history();
}

function balance_history_page_go(index) {
	balanceHistoryFilterParams.paging_info.page = index;
	refresh_balance_history();
}


function lock_form_submit()
{
	theLockScreenPassword = vueLayout.lockPassword;
	vueGlobal.modals.lock = false;

	CallFunction("LOCK 65535");
	CallFunction("SETWINDOWSIZE -1*-1");
	theLastWindowSize = "-1*-1";
	CallFunction("SETWINDOWTOPMOST 1");

	vueGlobal.isLocked = true;
	vueLayout.lockPassword = '';
	vueLayout.unlockPassword = '';

	return false;
}


function unlock_form_submit()
{
	var pwd = vueLayout.unlockPassword;
	if (pwd != theLockScreenPassword) {
		setTimeout(function() {
			sweetAlert("", translate_string("Wrong password!"), "error");
		},100);
		return false;
	}

	unlock_pc();

	return false;
}

async function feedback_form_submit()
{
	var subject = vueLayout.feedbackSubject;
	var message = vueLayout.feedbackMessage;

	if (subject.length == 0) {
		sweetAlert("", translate_string("Subject can not be empty!"), "error");
		return false;
	}

	if (message.length == 0) {
		sweetAlert("", translate_string("Message can not be empty!"), "error");
		return false;
	}
	
	vueGlobal.isLoading = true;

	const token = await theApiClient.getToken()
	if(!token){
		vueGlobal.modals.feedback = false;
		vueGlobal.isLoading = false;
		return false;
	}
	const data = await theApiClient.callCafeApi('customerFeedback','post',{
			member_account: thePCStatus.member_account,
			subject: subject,
			message: message,
			pc_name: thePCInfo.pc_name
	}).catch(ICafeApiError.show).finally(()=>{
		vueGlobal.isLoading = false;
	})
	if(data)
		toast(translate_string("Your feedback has been sent"));
	vueGlobal.modals.feedback = false;
	
	return false;
}

async function change_password_form_submit()
{
	vueGlobal.isLoading = true;

	var old_password = vueLayout.oldPassword;
	var new_password = vueLayout.newPassword;
	var confirm_password = vueLayout.confirmPassword;

	if(old_password == '')
	{
		sweetAlert("", translate_string("Old password can not be empty!"), "error");
		vueGlobal.isLoading = false;
		return false;
	}
	if(new_password == '')
	{
		sweetAlert("", translate_string("New password can not be empty!"), "error");
		vueGlobal.isLoading = false;
		return false;
	}
	if(confirm_password == '')
	{
		sweetAlert("", translate_string("Confirm password can not be empty!"), "error");
		vueGlobal.isLoading = false;
		return false;
	}
	if(new_password != confirm_password)
	{
		sweetAlert("", translate_string("The new password and confirm password do not match!"), "error");
		vueGlobal.isLoading = false;
		return false;
	}
	const token = await theApiClient.getToken()
	if (!token) {
		vueGlobal.isLoading = false;
		vueGlobal.modals.changePassword = false;
		return false;
	}
	const data = await theApiClient.callCafeApi('memberChangePassword', 'post', {
		old_password: old_password,
		new_password: new_password,
		member_id: thePCStatus.member_id
	}).catch(ICafeApiError.show).finally(() => {
		vueGlobal.isLoading = false;
	})
	if(data)
		sweetAlert(translate_string("Succeed"), translate_string("The password was changed successfully."), "success");
	vueGlobal.modals.changePassword = false;

	return false;
}

function show_set_lockpassword_dialog()
{
	vueLayout.lockPassword = '';
	vueGlobal.modals.lock = true;
	PetiteVue.nextTick(() => document.getElementById('lockform_password')?.focus());
}

function customer_feedback()
{
	vueLayout.feedbackSubject = '';
	vueLayout.feedbackMessage = '';

	vueGlobal.modals.feedback = true;
}

function audio_settings()
{
	theAudioSettings.setup()
	CallFunction("VOLUME");
	vueGlobal.modals.audio = true;
}

function display_settings()
{
	CallFunction("RUN control.exe desk.cpl");
}

function sound_settings()
{
	CallFunction("RUN control.exe mmsys.cpl");
}

function mouse_settings()
{
	theMouseSettings.setup()
	CallFunction("MOUSE_DOUBLE_CLICK_SPEED")
	CallFunction("MOUSE_MOVE_SPEED")
	CallFunction("MOUSE_SMOOTHNESS")
	vueGlobal.modals.mouse = true;
}

function change_password_click()
{
	vueLayout.oldPassword = '';
	vueLayout.newPassword = '';
	vueLayout.confirmPassword = '';

	vueGlobal.modals.changePassword = true;
}

function ConvertToMember()
{
	this.init = function() {
		vueGlobal.menuButton.convertToMember = false;
		let license_convert_to_member_enable = typeof(theSettings.license_convert_to_member_enable) != 'undefined' ? theSettings.license_convert_to_member_enable : 0;
		if (license_convert_to_member_enable && is_logined() && (thePCStatus.member_group_id === MEMBER_GROUP_GUEST || thePCStatus.member_group_id === MEMBER_GROUP_PREPAID || thePCStatus.member_group_id === MEMBER_GROUP_OFFER))
			vueGlobal.menuButton.convertToMember = true;	
	}

	this.show = function() {
		vueLayout.convertAccount = '';
		vueLayout.convertBirthday = '';
		vueLayout.convertPassword = '';
		vueLayout.convertConfirmPassword = '';
		vueLayout.convertFirstName = '';
		vueLayout.convertLastName = '';
		vueLayout.convertPhone = '';
		vueLayout.convertEmail = '';
		vueLayout.convertSmsCode = '';
		vueLayout.convertClubRuleChecked = false;
		vueLayout.convertPersonalDataChecked = false;
		vueLayout.convertPromoCode = '';
		vueGlobal.modals.convertMember = true;
	}

	this.show_club_rules = function () {
		vueGlobal.modals.clubRules = true;
	}

	this.show_personal_data = function () {
		vueGlobal.modals.personalData = true;
	}

	this.agreement_check = function () {
		// Logic moved to Vue calculated property or simple binding, this function might be deprecated or used for manual trigger if needed
		// But with v-model, we can just check the values in submit or computed property for button disabled state.
		// For now, removing the jQuery check.
	}

	this.submit = async function() {
		var account = vueLayout.convertAccount;
		var birthday = vueLayout.convertBirthday;
		var password = vueLayout.convertPassword;
		var confirm_password = vueLayout.convertConfirmPassword;
		var first_name = vueLayout.convertFirstName;
		var last_name = vueLayout.convertLastName;
		var phone = vueLayout.convertPhone;
		var email = vueLayout.convertEmail;
		var promo_code = vueLayout.convertPromoCode;

		if(account.length === 0) {
			sweetAlert("", translate_string("Account can not be empty!"), "error");
			return false;
		}
		if(password.length === 0) {
			sweetAlert("", translate_string("Password can not be empty!"), "error");
			return false;
		}
		if(confirm_password.length === 0 || password != confirm_password) {
			sweetAlert("", translate_string("The new password and confirm password do not match!"), "error");
			return false;
		}

		// 检查协议同意
		var register_agreement_enable = theSettings.register_agreement_enable ?? 0;
		if (register_agreement_enable == 1) {
			if (!vueLayout.convertClubRuleChecked || !vueLayout.convertPersonalDataChecked) {
				sweetAlert("", translate_string("Please agree to the club rules and privacy policy!"), "error");
				return false;
			}
		}

		const performSubmit = async () => {
			vueGlobal.isLoading = true;
			
			let token = await theApiClient.getToken()
			if (!token) {
				vueGlobal.isLoading = false;
				vueGlobal.modals.convertMember = false;
				return;
			}
			await theApiClient.callCafeApi('convertToMember', 'POST', {
				account: account,
				birthday: birthday,
				password: password,
				first_name: first_name,
				last_name: last_name,
				phone: phone,
				email: email,
				pc_name: thePCInfo.pc_name,
				id_card: vueLayout.convertIdCard,
				promo_code: promo_code
			}).then(() => {
				// vueGlobal.modals.convertMember = false;
			}).catch(ICafeApiError.show).finally(() => {
				vueGlobal.isLoading = false;
				vueGlobal.modals.convertMember = false;
			})
		}

		if (theSettings.sms_enable == 1) {
			if (!vueLayout.convertSmsCode) {
				sweetAlert("", translate_string("Please enter the SMS verification code!"), "error");
				return false;
			}
			
			// Mock vueRegister for helper function
			if (typeof vueRegister === 'undefined') {
				window.vueRegister = {};
			}
			vueRegister.phone = vueLayout.convertPhone;
			vueRegister.member_sms_code = vueLayout.convertSmsCode;

			SmsClassFun.verifySmscode(function (result) {
				if (result.code != 200) {
					sweetAlert("", translate_string(result && result.message ? result.message : 'SMS verification code mismatch'), "error");
					return false;
				}
				performSubmit();
			}, '#form-convert-member')
			return;
		}

		performSubmit();

	}
	
	ICAFEMENU_CORE.onWss('convert_to_member', packet => {
		vueGlobal.isLoading = false;

		if (packet.status == 'error') {
			sweetAlert("", translate_string(packet.data.message), "error");
			return;
		}
		vueGlobal.modals.convertMember = false;
	})

}