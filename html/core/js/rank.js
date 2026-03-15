function Rank()
{
	this.show = async function() {

		let gameCode = ['fortnite', 'pubg', 'lol', 'dota2', 'valorant', 'csgo', 'apex'];

		// 添加游戏到gameCode
		if (theSettings.game_rank_options_fortnite == 0) {
			gameCode = gameCode.filter(game => game !== 'fortnite');
		}
		if (theSettings.game_rank_options_pubg == 0) {
			gameCode = gameCode.filter((game) => game !== "pubg")
		}
		if (theSettings.game_rank_options_dota2 == 0) {
			gameCode = gameCode.filter(game => game !== 'dota2');
		}
		if (theSettings.game_rank_options_csgo == 0) {
			gameCode = gameCode.filter(game => game !== 'csgo');
		}
		if (theSettings.game_rank_options_valorant == 0) {
			gameCode = gameCode.filter(game => game !== 'valorant');
		}
		if (theSettings.game_rank_options_lol == 0) {
			gameCode = gameCode.filter(game => game !== 'lol');
		}
		if (theSettings.game_rank_options_apex == 0) {
			gameCode = gameCode.filter(game => game !== 'apex');
		}

		// Filter games that need data fetching
		const gamesToFetch = gameCode.filter(type => 
			!vueRank.items[type] || vueRank.items[type].length === 0
		);

		if (gamesToFetch.length > 0) {
			vueGlobal.isLoading = true;
			
			const promises = gamesToFetch.map(type => {
				return theApiClient.callCafeApi('games/action/gameRankData', 'get', { 
						game_code: type, 
						page_size: 10, 
						data_type: 'weekly', 
						rank_week: 'last' 
					})
				.catch(ICafeApiError.skip)
				.then(data => {
					if (data && data.items) {
						vueRank.items[type] = JSON.parse(JSON.stringify(data.items));
					}
				});
			});

			try {
				await Promise.all(promises);
			} finally {
				vueGlobal.isLoading = false;
			}
		}

		vueGlobal.pageType = "Rank";
		vueGlobal.showBottom = false;
		if (gameCode.length == 0) {
			vueRank.active_game = 'fortnite'
		} else {
			vueRank.active_game = gameCode[0];
		}

		PetiteVue.nextTick(() => {
			$("#rank-carousel").carousel();
			$('#rank-carousel').on('slid.bs.carousel', function () {
				var activeItem = $(this).find('.carousel-item.active');
				vueRank.active_game = activeItem.data("game");
			});
			ui_init();
			$('[data-toggle="tooltip"]').tooltip();
		});
		
	}
}