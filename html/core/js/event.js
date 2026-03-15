function Events()
{
	var that = this;
	this.events = [];
	this.event_last_refreshed = { timestamp: 0, event_id: '' };
	this.current_opened_event_id = '';

	this.gamecode2names = getGameCode2Names();

	this.reset = function() {
		that.events = [];
		that.event_last_refreshed = { timestamp: 0, event_id: '' };
		
		// Reset reactive states
		vueEventBanner.event = [];
		vueEventsMy.events = [];
		vueEventsActive.events = [];
	}

	this.show = function() {
		that.current_opened_event_id = '';
		vueGlobal.pageType = "Event";
		vueGlobal.showBottom = true;

		// 确保页面显示后再加载数据
		PetiteVue.nextTick(() => {
			if (theEvents.events.length == 0) {
				theEvents.load_list();
			} else {
				// 如果已有数据，也需要重新构建 HTML 以确保显示正确
				that.build_event_list_html();
			}
		});
	}

	this.load_list = async function () {
		vueGlobal.isLoading = true;
		const data = await theApiClient.callCafeApi('events/eventList', 'get', {
			pc_name: thePCInfo.pc_name
		}).catch(ICafeApiError.skip).finally(()=>vueGlobal.isLoading = false)
		const events = data?.events
		if (events !== undefined) {
			this.events = events;
			this.build_event_list_html();
		} else {
			console.log('Events data is undefined, clearing events array');
			this.events = [];
			this.build_event_list_html();
		}
	}

	this.refresh =async function() {
		if (that.event_last_refreshed.event_id == that.current_opened_event_id && moment().unix() - that.event_last_refreshed.timestamp < 30) {
			return;
		}
		that.event_last_refreshed = { timestamp: moment().unix(), event_id: that.current_opened_event_id };

		if (that.current_opened_event_id.length == 0) {
			that.load_list();
			return;
		}
		vueGlobal.isLoading = true;
		const data = await theApiClient.callCafeApi('events/eventDetail', 'get', {
			pc_name: thePCInfo.pc_name,
			event_id: that.current_opened_event_id
		}).catch(ICafeApiError.skip).finally(() => vueGlobal.isLoading = false)
		if (!data) {
			return
		}
		for (var i = 0; i < that.events.length; i++) {
			if (that.events[i].event_id == data.event.event_id) {
				that.events[i] = data.event;

				that.events[i].event_status = 'active';
				if (moment(that.events[i].event_end_time_local).isBefore())
					that.events[i].event_status = 'past';
				if (moment(that.events[i].event_start_time_local).isAfter())
					that.events[i].event_status = 'upcoming';

				that.gamecode2names.forEach(function (game) {
					if (that.events[i].event_game_code == game.code) {
						that.events[i].game_name = game.name;
					}
				});

				// If current member record need push to members end
				if (that.events[i].members.length > 0 && that.events[i].emember_id && that.events[i].emember_rank > that.events[i].members[that.events[i].members.length - 1].emember_rank) {
					that.events[i].members.push({
						emember_id: that.events[i].emember_id,
						emember_member_account: that.events[i].emember_member_account,
						emember_rank: that.events[i].emember_rank,
						emember_matches: that.events[i].emember_matches,
						emember_point_matches: that.events[i].emember_point_matches,
						emember_bonus: that.events[i].emember_bonus,
						emember_point: that.events[i].emember_point,
						emember_wins: that.events[i].emember_wins,
						emember_kills: that.events[i].emember_kills,
						emember_assists: that.events[i].emember_assists,
						emember_deaths: that.events[i].emember_deaths,
						emember_lasthits: that.events[i].emember_lasthits,
						license_country: that.events[i].license_country,
						license_icafename: that.events[i].license_icafename
					});
				}
				break;
			}
		}
		that.build_event_list_html();
		that.build_event_detail_html(data.event.event_id);
	}

	this.open = async function(event_id) {

		vueGlobal.pageType = "EventDetail";
		vueGlobal.showBottom = false;

		that.current_opened_event_id = event_id;
		var current_event = null;
		that.events.forEach(function(obj) {
			if (obj.event_id == event_id)
				current_event = obj;
		});

		that.build_event_detail_html(event_id);

		// If detail not load
		if (typeof(current_event.members) == 'undefined') {
			vueGlobal.isLoading = true;

			const data = await theApiClient.callCafeApi('events/eventDetail', 'get', {
				pc_name: thePCInfo.pc_name,
				event_id: event_id
			}).catch(ICafeApiError.skip).finally(() => vueGlobal.isLoading = false)
			if (!data) return;
			for (var i = 0; i < that.events.length; i++) {
				if (that.events[i].event_id == data.event.event_id) {
					that.events[i] = data.event;

					that.events[i].event_status = 'active';
					if (moment(that.events[i].event_end_time_local).isBefore())
						that.events[i].event_status = 'past';
					if (moment(that.events[i].event_start_time_local).isAfter())
						that.events[i].event_status = 'upcoming';

					that.gamecode2names.forEach(function (game) {
						if (that.events[i].event_game_code == game.code) {
							that.events[i].game_name = game.name;
						}
					});

					// If current member record need push to members end
					if (that.events[i].members.length > 0 && that.events[i].emember_id && that.events[i].emember_rank > that.events[i].members[that.events[i].members.length - 1].emember_rank) {
						that.events[i].members.push({
							emember_id: that.events[i].emember_id,
							emember_member_account: that.events[i].emember_member_account,
							emember_rank: that.events[i].emember_rank,
							emember_matches: that.events[i].emember_matches,
							emember_point_matches: that.events[i].emember_point_matches,
							emember_bonus: that.events[i].emember_bonus,
							emember_point: that.events[i].emember_point,
							emember_wins: that.events[i].emember_wins,
							emember_kills: that.events[i].emember_kills,
							emember_assists: that.events[i].emember_assists,
							emember_deaths: that.events[i].emember_deaths,
							emember_lasthits: that.events[i].emember_lasthits,
							license_country: that.events[i].license_country,
							license_icafename: that.events[i].license_icafename
						});
					}
					break;
				}
			}

			that.build_event_list_html();
			that.build_event_detail_html(data.event.event_id);
		}
	}

	this.build_event_detail_html = function(event_id) {
		var current_event = null;
		that.events.forEach(function(obj) {
			if (obj.event_id == event_id)
				current_event = obj;
		});

		// $('#games .event-detail-container .events').html(tmpl('tmpl-events', {events: [current_event], is_details_page: true}));
		vueEventsDetail.events = JSON.parse(JSON.stringify([current_event]));
		//$('#games .event-detail-container .event-buttons').html(tmpl('tmpl-event-buttons', {event: current_event}));
		vueEventButtons.event = JSON.parse(JSON.stringify(current_event));
		//$('#table-event-detail').html(tmpl('tmpl-event-detail', { event: current_event, members: (typeof(current_event.members) == 'undefined' ? [] : current_event.members) }));
		vueEventDetail.event = JSON.parse(JSON.stringify(current_event));
		vueEventDetail.members = JSON.parse(JSON.stringify(typeof(current_event.members) == 'undefined' ? [] : current_event.members));

		PetiteVue.nextTick(() => {
			ui_init();
			$('[data-toggle="tooltip"]').tooltip();
		});
	}

	this.join_post = async function() {
		if (vueGlobal.joinEventTermsAgreed == false) {
			sweetAlert("", translate_string('You must agree the terms of services before submitting.'), 'error');
			return;
		}

		var event_id = vueGlobal.joinEventId;
		vueGlobal.modals.joinEvent = false;
		vueGlobal.isLoading = true;

		await theApiClient.callCafeApi('events/eventJoin', 'POST', {
			pc_name: thePCInfo.pc_name,
			event_id: event_id
		}).catch(ICafeApiError.skip).finally(() => vueGlobal.isLoading = false)
		that.event_last_refreshed = { timestamp: 0, event_id: '' };
		that.refresh();
	}

	this.join = function(event_id) {
		var current_event = null;
		that.events.forEach(function(obj) {
			if (obj.event_id == event_id)
				current_event = obj;
		});

		if (current_event == null)
			return;

		if (typeof(current_event.emember_member_account) != 'undefined' || current_event.event_status == 'past')
			return;

		vueGlobal.joinEventId = event_id;
		vueGlobal.joinEventTermsAgreed = false; // Reset agreement
		vueGlobal.modals.joinEvent = true;
	}

	this.play = function(event_id) {
		var current_event = null;
		that.events.forEach(function(obj) {
			if (obj.event_id == event_id)
				current_event = obj;
		});

		if (current_event == null)
			return;

		if (typeof(current_event.emember_member_account) == 'undefined' && current_event.event_status != 'past') {
			that.join(event_id);
			return;
		}

		if (typeof(current_event.event_play_command) == 'undefined' || current_event.event_play_command.length == 0)
			return;

		CallFunction("RUN " + current_event.event_play_command);
	}

	this.build_event_list_html = function() {
		var event_banner = null;
		for (var i=0; i<that.events.length; i++) {
			that.events[i].event_status = 'active';
			if (moment(that.events[i].event_end_time_local).isBefore())
				that.events[i].event_status = 'past';
			if (moment(that.events[i].event_start_time_local).isAfter())
				that.events[i].event_status = 'upcoming';

			that.gamecode2names.forEach(function(game) {
				if (that.events[i].event_game_code == game.code) {
					that.events[i].game_name = game.name;
				}
			});

			if (that.events[i].event_in_banner)
				event_banner = that.events[i];
		}

		var my_events = [];
		var active_events = [];
		that.events.forEach(function(item) {
			if (typeof(item.emember_id) != 'undefined')
				my_events.push(item);
			if (typeof(item.emember_id) == 'undefined' && item.event_status == 'active')
				active_events.push(item);
		});

		my_events.sort((a, b) => {
			let a_status_score = 0;
			let b_status_score = 0;
			if (a.event_status === 'active')
				a_status_score = 2;
			if (a.event_status === 'upcoming')
				a_status_score = 1;
			if (b.event_status === 'active')
				b_status_score = 2;
			if (b.event_status === 'upcoming')
				b_status_score = 1;
			if (a_status_score != b_status_score)
				return b_status_score - a_status_score;

			if (moment(a.event_start_time_local).isBefore(moment(b.event_start_time_local)))
				return 1;
			return -1;
		})

		if (event_banner != null) {
			vueEventBanner.event = JSON.parse(JSON.stringify(event_banner));
		} else {
			vueEventBanner.event = [];
		}

		if (my_events.length > 0) {
			vueEventsMy.events = JSON.parse(JSON.stringify(my_events));
		} else {
			vueEventsMy.events = [];
		}

		if (active_events.length > 0) {
			const myEventIds = new Set(my_events.map(e => e.event_id));
			const filtered_active_events = active_events.filter(e => !myEventIds.has(e.event_id));
			vueEventsActive.events = JSON.parse(JSON.stringify(filtered_active_events));
		} else {
			vueEventsActive.events = [];
		}

		PetiteVue.nextTick(() => {
			ui_init();
			$('[data-toggle="tooltip"]').tooltip();
		});
	}

	this.rank_baseurl = function() {
		var rank_baseurl = 'https://rank.icafecloud.com';
		if (typeof(theCafe.rank_baseurl) != 'undefined')
			rank_baseurl = theCafe.rank_baseurl;
		return rank_baseurl;
	}
	//TODO useless and remove
	this.onAPIResponse = function(api_action, response) {
		vueGlobal.isLoading = false;
		if (response.result == 0) {
			sweetAlert("", translate_string(response.message), 'error');
			return;
		}

		if (api_action.indexOf('type=event-list') >= 0) {
			that.events = response.events;
			that.build_event_list_html();
			return;
		}

		if (api_action.indexOf('type=event-detail') >= 0) {
			for (var i=0; i<that.events.length; i++) {
				if (that.events[i].event_id == response.event.event_id) {
					that.events[i] = response.event;

					that.events[i].event_status = 'active';
					if (moment(that.events[i].event_end_time_local).isBefore())
						that.events[i].event_status = 'past';
					if (moment(that.events[i].event_start_time_local).isAfter())
						that.events[i].event_status = 'upcoming';

					that.gamecode2names.forEach(function(game) {
						if (that.events[i].event_game_code == game.code) {
							that.events[i].game_name = game.name;
						}
					});

					// If current member record need push to members end
					if (that.events[i].members.length > 0 && that.events[i].emember_id && that.events[i].emember_rank > that.events[i].members[that.events[i].members.length-1].emember_rank) {
						that.events[i].members.push({
							emember_id: that.events[i].emember_id,
							emember_member_account: that.events[i].emember_member_account,
							emember_rank: that.events[i].emember_rank,
							emember_matches: that.events[i].emember_matches,
							emember_point_matches: that.events[i].emember_point_matches,
							emember_bonus: that.events[i].emember_bonus,
							emember_point: that.events[i].emember_point,
							emember_wins: that.events[i].emember_wins,
							emember_kills: that.events[i].emember_kills,
							emember_assists: that.events[i].emember_assists,
							emember_deaths: that.events[i].emember_deaths,
							emember_lasthits: that.events[i].emember_lasthits,
							license_country: that.events[i].license_country,
							license_icafename: that.events[i].license_icafename
						});
					}
					break;
				}
			}

			that.build_event_list_html();
			that.build_event_detail_html(response.event.event_id);
			return;
		}

		if (api_action.indexOf('type=event-join') >= 0) {
			if (response.result == 0) {
				sweetAlert("", translate_string(response.message), 'error');
				return;
			}

			that.event_last_refreshed = { timestamp: 0, event_id: '' };
			that.refresh();
			return;
		}
	}

}