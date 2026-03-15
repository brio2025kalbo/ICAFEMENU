/**
 * by Link
 * 2025 08
 * icafememu api
 */
window.thePCInfo = { pc_name: "G-75" };

class ICafeApiError extends Error {
	constructor(message, code) {
		super(message)
		this.code = code
	}
	static skip = (e) => {
		var errorMessage = (e?.message ?? 'unknown');
		console.log('### ', e.stack);
	}
	static show = (e) => {
		var errorMessage = (e?.message ?? 'unknown');
		console.log('### ', e.stack);
		sweetAlert("", translate_string(errorMessage), 'error');
	}
}

/**
 * 1. 实现httpAPI的封装
 * 2. 管理pc和member的状态信息
 */
class ApiClient {

	constructor() {
		this.server_code = 'cp';
		this.icafeId = '0';
		this.memberInfo = {};
		this.pcStatus = {};
		this.pcInfo = {
			"pc_name" : "",
			"pc_turn_off_monitor_seconds" : 0,
			"version_date": ""};
		this.init();
	}
	init() {
		ICAFEMENU_CORE.onWss('client_status', ({ data }) => {
			this.pcStatus = data?.client_status ?? {};
		})
		ICAFEMENU_CORE.onCmd('PCInfo', strParam => {
			let newInfo = JSON.parse(strParam);
			console.log("Received PCInfo command:", newInfo);
			
			// Protect your hardcoded pc_name
			newInfo.pc_name = "G-75"; 
			
			this.pcInfo = newInfo;
			
			// Also update the global variable if it exists
			if (typeof thePCInfo !== 'undefined') {
				Object.assign(thePCInfo, this.pcInfo);
			}
		});
	}
	setServerCode(code) {
		this.server_code = code;
	}
	setIcaFeId(id) {
		this.icafeId = id;
	}
	/**
	 * server api url
	 * start with api/v2
	 * @param {*} uri 
	 * @returns 
	 */
	getServerUrl(uri) {
		if (uri.startsWith('/')) {
			uri = uri.substring(1);
		}
		return `https://${this.server_code}.icafecloud.com/api/v2/${uri}`;
	}
	/**
	 * cafe api url
	 * start with cafe id
	 * @param {*} uri 
	 * @returns 
	 */
	getCafeUrl(uri) {
		if (uri.startsWith('/')) {
			uri = uri.substring(1);
		}
		return `https://${this.server_code}.icafecloud.com/api/v2/cafe/${this.icafeId}/${uri}`;
	}
	/**
	 * is login
	 * @returns 
	 */
	isLogined() {
		return !!this.pcStatus?.member_account?.length 
	}
	/**
	 * is member login
	 * @returns 
	 */
	isMemberLogin() {
		return this.isLogined() && this.pcStatus.member_group_id > MEMBER_GROUP_GUEST
	}
	/**
	 * call api /api/v2/{endpoint}
	 * 正确返回逻辑
	 * 1. http statut == 0 
	 * 2. json数据的 code==200
	 * 3. 支付接口 result != undefined
	 * 自动refreshtoken
	 * 1. error.code != 401
	 * 2. 不是clientStartSession
	 * 3. 不是guestLogin
	 * @param {*} endpoint 
	 * @param {*} method 
	 * @param {*} data get请求会拼query参数，其余会转成json body
	 * @returns 
	 */
	async callApi(endpoint, method = 'GET', data = null, opt = {}) {
		 // --- FORCE OVERRIDE PC NAME ---
		 const targetPCName = "G-75";
    
		 if (data && typeof data === 'object') {
			 if (data.pc_name) {
				 console.log(`Forcing pc_name from "${data.pc_name}" to "${targetPCName}"`);
				 data.pc_name = targetPCName;
			 }
		 }
		 // ------------------------------
	 
		 // --- BYPASS MAINTENANCE BLOCK ---
		 if (endpoint.includes('clientStartSession')) {
			 console.log("Bypassing maintenance check for clientStartSession");
			 // We still let the call happen to see the response, 
			 // but you could also return a mock success here if the server keeps failing.
		 }
		 // --------------------------------
	 
		 console.log('callApi ' + method + ' ' + endpoint);
		let url = /^http/i.test(endpoint) ? endpoint : this.getServerUrl(endpoint);
		const options = {
			method: method,
			headers: {
				'Content-Type': 'application/json'
			}
		};
		if (this.getMemberInfo()?.token) {
			options.headers['Authorization'] = `Bearer ${this.getMemberInfo()?.token}`;
		}
		if (data) {
			for (const key in data) {
				if (!(data[key] || data[key] === 0 || data[key] === false || data[key] === '')) {
					delete data[key]
				}
			}
			if (/get/i.test(method)) {
				url = new URL(url);
				for (const key in data) {
					url.searchParams.append(key, data[key]);
				}
				url.searchParams.append('_t', Date.now());
			} else {
				options.data = JSON.stringify(data)
			}
		}

		if (opt.headers) {
			options.headers = { ...options.headers, ...opt.headers }
			delete opt.headers
		}
		
		var json = null;

		try
		{
			json = await $.ajax({ url, method, dataType: 'json', ...options,...opt});
		}
		catch(error)
		{
			if (!/memberLogin/.test(url))
				this.refreshApiToken();
			let errorMessage = JSON.stringify(error);
			let message = `callApi_error url: ${url} message: ${errorMessage}`
			console.log(message)
			throw new ICafeApiError(errorMessage, 1);
		}
		
		if (!json)
			return null;
		
		if (typeof json.result !== 'undefined') {
			return json;
		}
		if (json.code !== 200) {
			let errorMessage = json.message ?? 'unknown';
			let message = `callApi_error url: ${url} code: ${json.code}, message: ${errorMessage}`
			console.log(message)
			throw new ICafeApiError(errorMessage, json.code)
		}
		console.log(JSON.stringify(json));
		return json.data;
	}

	/**
	 * call cafe api /api/v2/cafe/<cafeid>/{endpoint}
		* @param {*} endpoint 
	 * @param {*} method 
	 * @param {*} data 
	 * @returns 
	 */
	async callCafeApi(endpoint, method = 'GET', data = null, opt = {}) {
		return this.callApi(this.getCafeUrl(endpoint), method, data, opt)
	}
	/**
	 * refresh api token
	 * @param {*} member_account 
	 * @param {*} status_pc_token 
	 * @param {*} member_password 
	 * @param {*} license_name 
	 * @param {*} pc_name 
	 * @returns 
	 */
	async memberLogin(member_account, status_pc_token, member_password, license_name, pc_name, booking_password = null) {
		let url = this.getServerUrl('auth/memberLogin');
		let data = { member_account, status_pc_token, member_password, license_name, pc_name, is_client: 1, };
		if (booking_password) {
			data.booking_password = booking_password;
		}
		let toknInfo = await this.callApi(url, 'POST', data);
		if(toknInfo){
			localStorage.setItem('clientMemberInfo', JSON.stringify(toknInfo));
			return toknInfo;
		}
		return null;
	}
	getMemberInfo() {
		let memberInfo = localStorage.getItem('clientMemberInfo');
		if (memberInfo && /^\{/.test(memberInfo)) {
			return JSON.parse(memberInfo);
		}
		return {};
	}
	clearMemberInfo() {
		localStorage.removeItem('clientMemberInfo');
	}
	async getToken() {
		return this.getMemberInfo()?.token
	}

	/**
	 * guest login 
	 * @param {*} data 
	 * @param {*} opt 
	 * @returns 
	 */
	async guestLogin(data,opt={}) {
		let url = this.getServerUrl('auth/guestLogin');
		let toknInfo = await this.callApi(url, 'POST', data, { ...opt })
		if(toknInfo){
			localStorage.setItem('clientMemberInfo', JSON.stringify(toknInfo));
			return toknInfo;
		}
	}
	/**
	 * 一般用在token失效后（api接口error），重新获取token
	 * 30秒内只会执行一次
	 */
	refreshApiToken = ICAFEMENU_CORE.throttle(async () => {
		return this.memberLogin(this.pcStatus.member_account, this.pcStatus.status_pc_token, null, theCafe.license_name, this.pcInfo.pc_name).catch(ICafeApiError.skip);
	}, 30_000)
}

const theApiClient = new ApiClient();
theApiClient.setServerCode(theSettings.license_info.license_server_code)
theApiClient.setIcaFeId(theCafe.id)