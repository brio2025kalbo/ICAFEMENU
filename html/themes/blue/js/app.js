// all message listen hook
ICAFEMENU_CORE.onWss('*', packet => {
	console.debug('app_on_wss', JSON.stringify(packet))
}).onCmd("*", (strParam, strCmd) => {
	// console.debug('app_on_cmd', strCmd, strParam)
});
