function Shop()
{
	this.order_items = [];
	this.gift_order_items = [];
	this.filtered_items = [];
	this.loaded = false;
	this.current_group_id = PRODUCT_GROUP_ALL;
	this.search = '';
	var that = this;

	// auto update promoted product
	setInterval(() => {
		if (that.current_group_id !== PRODUCT_GROUP_PROMOTED) {
			return;
		}
		that.change_group(PRODUCT_GROUP_PROMOTED)
	}, 30000);
	
	this.initOfferGoods = function() {
		this.change_group(PRODUCT_GROUP_OFFERS); 
		this.change_group(PRODUCT_GROUP_ALL);
	};

	this.show = function() {
		refreshBalanceInfo()
		
		this.order_items = [];

		if (!this.loaded) {
			this.loaded = true;
			theProductGroupList.push({
				product_group_desc: "",
				product_group_has_icon: false,
				product_group_id: PRODUCT_GROUP_COINS,
				product_group_name: translate_string("Gifts")
			});

			for (var i=0; i<theProductGroupList.length; i++)
			{
				if (theProductGroupList[i].product_group_id == PRODUCT_GROUP_COINS) {
					var total = 0;
					theProductList.forEach(function(obj) {
						if (obj.product_coin_price > 0)
							total += 1;
					});
					theProductGroupList[i].product_count = total;
					continue;
				}

				var total = 0;
				theProductList.forEach(function(obj) {
					if (obj.product_group_id == theProductGroupList[i].product_group_id)
						total += 1;
				});
				theProductGroupList[i].product_count = total;
			}
		}
		
		// 组合成二级树状结构
		const product_group_map = {};
		var TopProductGroupList = [];
		theProductGroupList.forEach(function(item) {
			product_group_map[item.product_group_id] = { ...item, children: [] };
		});
		
		theProductGroupList.forEach(function(item) {
			const node = product_group_map[item.product_group_id];
			const product_parent_group_id = item?.product_parent_group_id || 0;
			if (product_parent_group_id === 0) {
				TopProductGroupList.push(node);
				return;
			} 
			if (product_group_map[product_parent_group_id]) {
				if (item.product_count > 0) {
					product_group_map[product_parent_group_id].children.push(node);
					product_group_map[product_parent_group_id].product_count += item.product_count;
				}
				return;
			}
			
			TopProductGroupList.push(node);
		});

		var items = [];
		TopProductGroupList = TopProductGroupList.filter(function (item){
			return item.product_count > 0 && item.product_group_id !== PRODUCT_GROUP_COINS;
		});
		for (var i=0; i<theProductGroupList.length; i++)
		{
			if (theProductGroupList[i].product_count <= 0) continue;

			if (theProductGroupList[i].product_group_id <= 0) {
				items.push(theProductGroupList[i]);
			}
		}

		TopProductGroupList.unshift({
			product_group_id: PRODUCT_GROUP_ALL,
			product_group_name: translate_string("All"),
			children: []
		})

		vueProductGroupList.items = JSON.parse(JSON.stringify(items));
		vueProductGroupList.tops = JSON.parse(JSON.stringify(TopProductGroupList));
		
		this.initOfferGoods(); // [NEW] Globally init offers

		vueGlobal.cartDate = this.format_date();
		// $('#cart').html(tmpl('tmpl-new-order-items', { items: [] }));
		vueOrderItems.total_cost = 0;
		vueOrderItems.total_tax = 0;
		vueOrderItems.total_amount = 0;
		vueOrderItems.total_discount = 0;
		vueOrderItems.max_bonuses = 0;
		vueOrderItems.payable_balance = 0;
		vueOrderItems.product_count = 0;
		vueOrderItems.member_group_id = thePCStatus.member_group_id;
		vueOrderItems.member_group_discount_rate = thePCStatus.member_group_discount_rate ?? 0;
		vueOrderItems.member_group_discount_offer = thePCStatus.member_group_discount_offer ?? 0;
		vueOrderItems.items = [];
		vueOrderItems.product_qty_map = {};

		vueGlobal.pageType = "Shop";
		vueGlobal.showBottom = false;

		// Search input bound via v-model="vueShop.searchProduct" and @input="theShop.onSearchInput" in template
		// onSearchInput is defined below to handle search changes
		
		PetiteVue.nextTick(() => {
			ui_init();
			$('[data-toggle="tooltip"]').tooltip();
			document.querySelectorAll('.dropdown-submenu .dropdown-toggle').forEach(toggle => {
				toggle.addEventListener('click', function(e) {
					e.preventDefault();
					e.stopPropagation();
					that.hideAllDropdownMenus();
					const nextMenu = this.nextElementSibling;
					if (nextMenu && nextMenu.classList.contains('custom-dropdown-menu')) {
						nextMenu.style.display = nextMenu.style.display === 'none' ? 'block' : 'none';
					}
				});
			});
		});
	};

	// -3 = all, -4 = promoted
	// group_level : 1 - top ; 2 - two
	
	// 搜索输入处理函数，由模板中 @input 调用
	this.onSearchInput = function() {
		that.change_group(vueProductGroupList.current_group_id, vueShop.searchProduct);
	};
	
	// 隐藏所有下拉菜单
	this.hideAllDropdownMenus = function() {
		document.querySelectorAll('.custom-dropdown-menu').forEach(menu => {
			menu.style.display = 'none';
		});
	};
	
	this.change_group = function(group_id, search = vueShop.searchProduct, group_level = 1) {
		if (vueShop.searchProduct !== search) {
			vueShop.searchProduct = search;
		}

		let filter_group_ids  = [group_id]
		if (group_level === 1) {
			that.current_group_id = group_id;
			vueProductGroupList.current_group_id = group_id
			vueProductGroupList.second_level_group_id = 0
			that.hideAllDropdownMenus();
			
			for (const product_group of vueProductGroupList.tops) {
				if (product_group.product_group_id !== group_id) {
					continue
				}
				product_group?.children?.forEach(function(item) {
					filter_group_ids.push(item.product_group_id)
				})
			}
		}
		
		if (group_level === 2) {
			vueProductGroupList.second_level_group_id = group_id
		}

		if (group_id == PRODUCT_GROUP_COINS) {
			vueGlobal.isGiftCart = true;
			this.gift_cart_refresh();
		}
		else {
			vueGlobal.isGiftCart = false;
			this.cart_refresh();
		}

		// Search input value is controlled by Vue
		that.filtered_items = [];
		theProductList.forEach(function(obj) {
			// dont's show print product
			if (obj.product_id == 'p--3' || obj.product_id == 'p--4')
				return;

			if (group_id == PRODUCT_GROUP_PROMOTED) {
				if(typeof(obj.product_is_promoted) == 'undefined' || obj.product_is_promoted == false)
					return;
			} else if (group_id != PRODUCT_GROUP_ALL) {
				if (group_id == PRODUCT_GROUP_OFFERS && obj.product_id.indexOf("o-") != 0) {
					return;
				}

				if (group_id == PRODUCT_GROUP_COINS && parseFloat(obj.product_coin_price) <= 0)
					return;

				if (group_id != PRODUCT_GROUP_COINS && group_id != PRODUCT_GROUP_OFFERS && !filter_group_ids.includes(obj.product_group_id))
					return;
			}

			// don't show 0 stock
			if (obj.product_unlimited == 0 && obj.product_qty <= 0)
				return;

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

			if (search.length > 0 && obj.product_name.toLowerCase().indexOf(search.toLowerCase()) < 0)
				return;

			that.filtered_items.push(obj);
		});

		//$('#product-list').html(tmpl('tmpl-product', { items: that.filtered_items }));
		//translate_obj($('#product-list'));
		var items = that.filtered_items;
		var itemsNew = [];
		for (var i=0; i<items.length; i++)
		{ 
			if(items[i].product_name.startsWith('*'))continue;
			if (theShop.current_group_id == PRODUCT_GROUP_COINS && items[i].product_coin_price <= 0) continue;
			if (theShop.current_group_id != PRODUCT_GROUP_COINS && items[i].product_price == 0 && items[i].product_coin_price > 0) continue;
			items[i].image = '';
			if (items[i].product_id.indexOf("o-") === 0) { items[i].image = 'images/default-offer.jpg'; }
			if (items[i].product_group_id >= 0) { items[i].image = 'images/default-product.jpg'; }
			if (items[i].product_has_image) { items[i].image = ICAFEMENU_CORE.posters_path(items[i].product_id + '.jpg'); }
			itemsNew.push(items[i]);
		}
		vueProducts.items = JSON.parse(JSON.stringify(itemsNew));

		if(group_id == PRODUCT_GROUP_PROMOTED) {
			let promotedProductList = [];
			for(var i=0, j = itemsNew.length; i<j; i+=4) {
				promotedProductList.push(itemsNew.slice(i, i+4))
			}
			vueHome.promotedItems = JSON.parse(JSON.stringify(promotedProductList));
			vueHome.promotedItems = JSON.parse(JSON.stringify(promotedProductList));
			vueHome.promotedGoods = JSON.parse(JSON.stringify(itemsNew));
		}
		
		if (group_id == PRODUCT_GROUP_OFFERS) {
			vueHome.offerGoods = JSON.parse(JSON.stringify(itemsNew));
		}

		PetiteVue.nextTick(() => {
			ui_init();
			$('[data-toggle="tooltip"]').tooltip();
		});
	};
	
	this.get_member_pay_later_status = function() {
		let member_group = [];
		try {
			const parsed = JSON.parse(theSettings?.pay_later || '{}');
			member_group =  Array.isArray(parsed.member_groups) ? parsed.member_groups : [];
		} catch {}
		
		let member_group_id = thePCStatus.member_group_id ?? 0
		
		return is_member_logined() && theSettings?.payment_method_pay_later == 1 && member_group.includes(member_group_id.toString()) ? 1 : 0;
	}
	
	this.cart_refresh = function() {
		vueOrderItems.total_cost = 0;
		vueOrderItems.total_tax = 0;
		vueOrderItems.total_amount = 0;
		vueOrderItems.total_discount = 0;
		
		vueOrderItems.enable_cash = 1
		vueOrderItems.enable_credit_card = 1
		vueOrderItems.enable_balance = 1
		vueOrderItems.enable_qr = 1
		vueOrderItems.enable_pay_later = that.get_member_pay_later_status();
		
		vueOrderItems.member_group_id = thePCStatus.member_group_id;
		vueOrderItems.member_group_discount_rate = thePCStatus.member_group_discount_rate ?? 0;
		vueOrderItems.member_group_discount_offer = thePCStatus.member_group_discount_offer ?? 0;
		let total_offer = 0;
		let product_count = 0;

		for (var i=0; i< this.order_items.length; i++)
		{
			// Calculate price based on payment method
			var effectivePrice = that.calculatePriceByPaymentMethod(this.order_items[i].product_price, vueOrderItems.payment_method);
			this.order_items[i].order_cost = effectivePrice * this.order_items[i].order_item_qty;
			var order_discount = this.order_items[i].product_is_offer ? vueOrderItems.member_group_discount_offer : vueOrderItems.member_group_discount_rate;
			if(!this.order_items[i].product_enable_discount)
				order_discount = 0;
			var order_tax = theTax.getTaxWithPrice(this.order_items[i].product_tax_id, this.order_items[i].order_cost * (1 - order_discount / 100.0));
			if(vueOrderItems.payment_method == PAY_METHOD_BALANCE)
				order_tax = 0;
			vueOrderItems.total_cost += parseFloat(this.order_items[i].order_cost);
			vueOrderItems.total_tax += parseFloat(order_tax);
			vueOrderItems.total_discount += parseFloat(this.order_items[i].order_cost) * order_discount / 100.0;
			vueOrderItems.total_amount += this.order_items[i].order_cost * (1 - order_discount / 100.0);
			vueOrderItems.total_offer += this.order_items[i].order_cost;
			if (this.order_items[i].product_is_offer) {
				total_offer +=  this.order_items[i].order_cost * (1 - order_discount / 100.0)
			} else {
				product_count++;
			}
			if(theSettings.tax_included_in_price == 0)
				vueOrderItems.total_amount += parseFloat(order_tax);
		}
		let max_bonuses = theSettings.bonus_buy_offer === 1 && theSettings.max_bonus_percentage > 0
			? Math.min(total_offer * theSettings.max_bonus_percentage / 100, memberInfo.member_balance_bonus)
			: 0;
		
		let cost_bonus = vueOrderItems.total_amount <= memberInfo.member_balance ? 0 : max_bonuses; //pay balance first
		if (theSettings.use_bonus_first) {
			cost_bonus = max_bonuses;
		}
		vueOrderItems.max_bonuses = cost_bonus
		vueOrderItems.payable_balance = vueOrderItems.total_amount - vueOrderItems.max_bonuses;
		vueOrderItems.product_count = product_count;
		
		vueOrderItems.items = JSON.parse(JSON.stringify(this.order_items));

		// update product_qty_map
		vueOrderItems.product_qty_map = {};
		for (var i=0; i<this.order_items.length; i++) {
			vueOrderItems.product_qty_map[this.order_items[i].product_id] = this.order_items[i].order_item_qty;
		}
		
		this.enable_cash = this.enable_credit_card = this.enable_balance = 1;
		
		for (var i=0; i<this.order_items.length; i++) 
		{
			var product_item = null;
			theProductList.forEach(function(obj) {
				if (obj.product_id == that.order_items[i].product_id)
					product_item = obj;
			});
			if(product_item == null)
				continue;
			if(typeof(product_item.product_group_payment_method) == 'undefined')
				continue;
			product_group_payment_method = JSON.parse(product_item.product_group_payment_method);
			product_group_payment_method = is_member_logined() ? product_group_payment_method.member : product_group_payment_method.guest;
			if(vueOrderItems.enable_cash && product_group_payment_method.indexOf('cash') < 0)
				vueOrderItems.enable_cash = 0;
			if(vueOrderItems.enable_qr && product_group_payment_method.indexOf('qr') < 0)
				vueOrderItems.enable_qr = 0;
			if(vueOrderItems.enable_credit_card && product_group_payment_method.indexOf('credit_card') < 0)
				vueOrderItems.enable_credit_card = 0;
			if(vueOrderItems.enable_balance && product_group_payment_method.indexOf('balance') < 0)
				vueOrderItems.enable_balance = 0;
			if(vueOrderItems.enable_pay_later && product_group_payment_method.indexOf('pay_later') < 0)
				vueOrderItems.enable_pay_later = 0;
		}

		PetiteVue.nextTick(() => {
			ui_init();
			$('[data-toggle="tooltip"]').tooltip();
		});
	}
	
	this.update_item_qty = function(e) {
		var product_id = e.target.dataset.productid;
		var qty = e.target.value;
		qty = parseInt(qty);

		var product_item = null;
		theProductList.forEach(function(obj) {
			if (obj.product_id == product_id)
				product_item = obj;
		});
		if (product_item == null)
			return;

		if (isNaN(qty) || qty < 1)
			qty = 1;
		if (product_item.product_unlimited == 0 && qty > product_item.product_qty)
			qty = product_item.product_qty;

		that.order_items.forEach(function(obj) {
			if (obj.product_id == product_id) {
				obj.order_item_qty = qty;
			}
		});

		that.cart_refresh();
	}

	this.cart_change_qty = function(product_id, qty) {
		var order_item = null;
		var product_item = null;

		theProductList.forEach(function(obj) {
			if (obj.product_id == product_id)
				product_item = obj;
		});
		if (product_item == null)
			return false;

		that.order_items.forEach(function(obj) {
			if (obj.product_id == product_id)
				order_item = obj;
		});

		if (order_item == null && qty > 0) {
			order_item = {
				product_id: product_id,
				product_name: product_item.product_name,
				product_tax_id: product_item.product_tax_id,
				product_price: product_item.product_price,
				product_enable_discount: product_item.product_enable_discount,
				product_is_offer: product_item.product_id.startsWith("o-") ? true : false,
				image: product_item.image,
				order_item_qty: 0,
			};
			that.order_items.push(order_item);
		}
		if (order_item == null)
			return false;

		var new_qty = order_item.order_item_qty + qty;
		for (var i=0; i<that.order_items.length; i++) {
			if (that.order_items[i].product_id == product_id) {
				that.order_items[i].order_item_qty = new_qty;
				// delete product or dec qty
				if(new_qty <= 0)
					that.order_items.splice(i, 1);
				break;
			}
		}

		this.cart_refresh();
		return false;
	};

	this.cart_clear = function() {
		refreshBalanceInfo()
		this.order_items = [];
		this.cart_refresh();
	};

	this.buy = function(product_id, qty) {
		var product_item = null;
		theProductList.forEach(function(obj) {
			if (obj.product_id == product_id)
				product_item = obj;
		});

		if (product_item && product_item.product_coin_price > 0) {
			this.gift_order_items = [];
			this.gift_cart_change_qty(product_id, qty);
			vueGlobal.isGiftCart = true;
			vueGlobal.modals.buy = true;
		} else {
			this.order_items = [];
			vueGlobal.isGiftCart = false;
			this.cart_change_qty(product_id, qty)
			vueGlobal.modals.buy = true;
		}
	};
	
	this.cart_done_promote = function() {
		theShop.cart_done(true);
	}

	this.cart_done = async function(buyNow = false) {

		if(vueOrderItems.payment_method == -1 ||
			(vueOrderItems.payment_method == PAY_METHOD_CASH && !vueOrderItems.enable_cash) ||
			(vueOrderItems.payment_method == PAY_METHOD_CARD && !vueOrderItems.enable_credit_card) ||
			(vueOrderItems.payment_method == PAY_METHOD_QR && !vueOrderItems.enable_qr) ||
			(vueOrderItems.payment_method == PAY_METHOD_BALANCE && !vueOrderItems.enable_balance) ||
			(vueOrderItems.payment_method == PAY_METHOD_PAY_LATER && !vueOrderItems.enable_pay_later))
		{
			sweetAlert("", translate_string("Please choose a payment method"), "error");
			return;
		}

		var items = [];
		
		that.order_items.forEach(function(obj) {
			items.push({
				product_id: obj.product_id,
				qty: obj.order_item_qty
			});
		});

		const token =await theApiClient.getToken()
		if (!token) {
			if (buyNow) {
				vueGlobal.modals.buy = false;
			}
			return;
		}
		vueGlobal.isLoading = true;
		let data = await theApiClient.callCafeApi('submitOrder', 'POST', {
			payment_method: vueOrderItems.payment_method,
			member_group_discount_rate: thePCStatus.member_group_discount_rate ?? 0,
			member_group_discount_offer: thePCStatus.member_group_discount_offer ?? 0,
			items: items,
			pc_name: thePCInfo.pc_name
		}).catch(ICafeApiError.show).finally(() => {
			vueGlobal.isLoading = false;
			if (buyNow) {
				vueGlobal.modals.buy = false;
			}
		});
		if(!data){
			return
		}
		toast(translate_string('Your order submitted'));
		if (data?.pay_method == PAY_METHOD_COIN) {
			theShop.gift_cart_clear();
			return;
		}
		theShop.cart_clear();
		if (data?.pay_method == PAY_METHOD_QR && data?.order_status == ORDER_STATUS_PENDING) {
			vueGlobal.isLoading = true;
			let url = theApiClient.getServerUrl(`cafe/${theApiClient.icafeId }/payOrder`)
			let payData = await fetch(url, {
				method: 'post', 
				body: JSON.stringify({ order_no: data.order_no }), 
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + theApiClient.getMemberInfo()?.token
				}
			}).then(res => res.json());
			vueGlobal.isLoading = false;
			this.showPayOrder(payData, true)
		}
	};

	this.gift_cart_refresh = function() {
		vueGiftOrders.total_amount = 0;
		for (var i=0; i<this.gift_order_items.length; i++) 
		{
			this.gift_order_items[i].order_cost = this.gift_order_items[i].order_item_qty * this.gift_order_items[i].product_coin_price;
			vueGiftOrders.total_amount += parseFloat(this.gift_order_items[i].order_cost);
		}
		vueGiftOrders.items = JSON.parse(JSON.stringify(this.gift_order_items));
		
		// update product_qty_map for badge display
		vueGiftOrders.product_qty_map = {};
		for (var i=0; i<this.gift_order_items.length; i++) {
			vueGiftOrders.product_qty_map[this.gift_order_items[i].product_id] = this.gift_order_items[i].order_item_qty;
		}
		
		PetiteVue.nextTick(() => {
			ui_init();
			$('[data-toggle="tooltip"]').tooltip();
		});
	}
	
	this.update_gift_item_qty = function(e) {

		var product_id = e.target.dataset.productid;
		var qty = e.target.value;
		qty = parseInt(qty);

		var product_item = null;
		theProductList.forEach(function(obj) {
			if (obj.product_id == product_id)
				product_item = obj;
		});
		if (product_item == null)
			return;

		if (isNaN(qty) || qty < 1)
			qty = 1;
		if (product_item.product_unlimited == 0 && qty > product_item.product_qty)
			qty = product_item.product_qty;

		that.gift_order_items.forEach(function(obj) {
			if (obj.product_id == product_id) {
				obj.order_item_qty = qty;
			}
		});

		that.gift_cart_refresh();
	};

	this.gift_cart_change_qty = function(product_id, qty) {
		console.log('[gift_cart_change_qty] Called with product_id:', product_id, 'qty:', qty);
		var order_item = null;
		var product_item = null;

		theProductList.forEach(function(obj) {
			if (obj.product_id == product_id)
				product_item = obj;
		});
		console.log('[gift_cart_change_qty] Found product:', product_item ? product_item.product_name : 'NOT FOUND');
		if (product_item == null)
			return false;
		
		this.gift_order_items.forEach(function(obj) {
			if (obj.product_id == product_id)
				order_item = obj;
		});

		if (order_item == null && qty > 0) {
			order_item = {
				product_id: product_id,
				product_name: product_item.product_name,
				product_coin_price: product_item.product_coin_price,
				image: product_item.image,
				order_item_qty: 0
			};
			this.gift_order_items.push(order_item);
		}
		if (order_item == null)
			return false;

		// delete product or dec qty
		var new_qty = order_item.order_item_qty + qty;
		if (new_qty <= 0) {
			for (var i=0; i<this.gift_order_items.length; i++) {
				if (this.gift_order_items[i].product_id == product_id) {
					this.gift_order_items.splice(i, 1);
					break;
				}
			}
			this.gift_cart_refresh();
		}

		for (var i=0; i<this.gift_order_items.length; i++) {
			if (this.gift_order_items[i].product_id == product_id) {
				this.gift_order_items[i].order_item_qty = new_qty;
				break;
			}
		}

		this.gift_cart_refresh();
		return false;
	};

	this.gift_cart_clear = function() {
		this.gift_order_items = [];
		this.gift_cart_refresh();
	};

	this.gift_cart_done = async function() {

		var items = [];
		that.gift_order_items.forEach(function(obj) {
			items.push({
				product_id: obj.product_id,
				qty: obj.order_item_qty
			});
		});

		let token = await theApiClient.getToken();
		if(!token){
			return;
		}
		vueGlobal.isLoading = true;
		const data = await theApiClient.callCafeApi('submitOrder', 'POST', {
			payment_method: PAY_METHOD_COIN,
			member_group_discount_rate: 0,
			member_group_discount_offer: 0,
			items: items,
			pc_name: thePCInfo.pc_name
		}).catch(ICafeApiError.show).finally(() => {
			vueGlobal.isLoading = false;
		})
		if(!data){
			return;
		}
		toast(translate_string('Your order submitted'));
		vueGlobal.modals.buy = false; // Close modal after success
		if (data?.pay_method == 3) {
			theShop.gift_cart_clear();
			return;
		}
		theShop.cart_clear();

	};
	
	this.format_date = function(time) {
		// TODO use moment(time).format('ddd, DD MMM YY').toUpperCase()
		var WEEKs = ["", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
		var MONTHs = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

		var d = new Date();
		if (typeof(time) != 'undefined' && time.length > 0) {
			var cols = time.split(' ');
			if (cols.length == 2) {
				var date_fields = cols[0].split('-');
				var time_fields = cols[1].split(':');
				if (date_fields.length == 3 && time_fields.length > 3)
					d = new Date(date_fields[0], date_fields[1], date_fields[2], time_fields[0], time_fields[1], time_fields[2]);
			}
		}
		return WEEKs[d.getDay() + 1].toUpperCase() + ", " + d.getDate() + " " + MONTHs[d.getMonth()+1].toUpperCase() + " " + (d.getYear() - 100);
	}
	
	this.show_topup = function()
	{
		vueTopup.resetOutputs();
		vueTopup.btn_group = true;
		vueTopup.showFormRows = true;
		vueTopup.showSummary = false;
		
		// Clear previous payment content
		if (document.querySelector('.myModalTopup #payment_qr')) {
			document.querySelector('.myModalTopup #payment_qr').innerHTML = '';
		}
		vueTopup.paymongo_html = '';
		vueTopup.midtrans_html = '';
		vueTopup.finik_html = '';
		vueTopup.manual_payment_html = '';
		vueTopup.payment_html = '';
		vueTopup.payment_url_div = false;
		vueTopup.payment_type_img = false;

		if (typeof memberInfo !== 'undefined' && memberInfo.member_name) {
			vueTopup.member_account = memberInfo.member_name;
		}
		vueGlobal.modals.topup = true;
	}

	this.topup = async function()
	{
		vueTopup.resetOutputs();
		if(vueTopup.topup_amount < theSettings.mini_qr_payment){
			sweetAlert('', translate_string('Please input mini amount')  + ' ' + theSettings.mini_qr_payment, 'warning');
			return
		}
		vueGlobal.isLoading = true;
		const data = await theApiClient.callCafeApi('getTopupUrl','post',{
			member_account: vueTopup.member_account,
			topup_amount: vueTopup.topup_amount,
			promo_code: vueTopup.promo_code,
			pc_name: thePCInfo.pc_name})
			.catch(ICafeApiError.show)
		.finally(()=>{
				vueGlobal.isLoading = false;
			})
		if (typeof (data.result) == 'undefined') {
			sweetAlert('', translate_string('Topup failed'), 'error');
			return;
		}
		if (data.result == 0) {
			sweetAlert('', data.message, 'error');
			return;
		}
		if (data.result == 1) {
			// switch to summary view
			vueTopup.showFormRows = false;
			vueTopup.showSummary = true;
			vueTopup.summaryMember = vueTopup.member_account;
			vueTopup.summaryAmount = (theSettings.currency ?? '$') + parseFloat(vueTopup.topup_amount).toFixed(2);
			vueTopup.summaryMinutes = vueTopup.topup_time;

			vueTopup.payment_qr = data.url;
			PetiteVue.nextTick(() => {
				var qrEl = document.querySelector('.myModalTopup #payment_qr');
				if(qrEl) {
					qrEl.innerHTML = '';
					new QRCode(qrEl, data.url);
				}
			});
			vueTopup.btn_group = false;

			if (data.type == 'kaspi') {
				vueTopup.payment_type_img = true;
			}
			if (data.type == 'razorpay') {
				vueTopup.payment_qr = '';
				vueTopup.payment_url_div = true;
				vueTopup.payment_html = `<img src="${data.url}" alt="Razorpay" />`;
			}
			if (data.type == 'manual') {
				vueTopup.payment_qr = '';
				let payment_manual_tip1 = translate_string('Scan and pay ');
				let payment_manual_tip2 = translate_string('Contact the staff and confirm your payment.');
				vueTopup.manual_payment_html = `
							<div>
							<ol>
								<li>
								${payment_manual_tip1}<font color="red" size="3rem">${data.amount.toFixed(2)}</font>
								</li>
								<li>
								${payment_manual_tip2}
								</li>
							</ol>
							<img src="${data.payment_url}"/>
							</div>
							`;
			}
			if (data.type == 'paymongo') {
				vueTopup.payment_qr = '';
				vueTopup.paymongo_html = `<div><img src="${data.payment_url}" alt="QR Code" style="width:266px" /></div>`;
			}
			if (data.type == 'midtrans') {
				vueTopup.payment_qr = '';
				vueTopup.midtrans_html = `<div><img src="${data.payment_url}" alt="midtrans QR Code" style="width:266px" /></div>`;
			}
			if (data.type == 'finik') {
				vueTopup.payment_qr = '';
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
		return true;
	}
	
	/**
	 * Price calculation helper functions for credit card rate
	 */

	// Get the credit card price rate from settings
	this.getCreditCardPriceRate = function() {
		return parseFloat(theSettings.credit_card_price_rate || 100);
	}

	// Calculate price based on payment method
	this.calculatePriceByPaymentMethod = function(originalPrice, paymentMethod) {
		const rate = that.getCreditCardPriceRate();

		// If rate is 100, no difference in pricing
		if (rate === 100) {
			return originalPrice;
		}

		// For credit card payments, apply the rate
		if (paymentMethod === PAY_METHOD_CARD || paymentMethod === PAY_METHOD_CARD_FOR_OFFER) {
			return originalPrice * (rate / 100);
		}

		// For cash and balance payments, use original price
		return originalPrice;
	}

	// Get discounted price for offers based on member group discount
	this.getOfferDiscountedPrice = function(price, enableDiscount) {
		var discount = enableDiscount ? (thePCStatus.member_group_discount_offer ?? 0) : 0;
		return price * (1 - discount / 100.0);
	}

	// Get both prices (original and credit card) for display
	this.getPriceDisplay = function(originalPrice) {
		const rate = that.getCreditCardPriceRate();
		const creditPrice = originalPrice * (rate / 100);

		return {
			originalPrice: parseFloat(originalPrice),
			creditPrice: parseFloat(creditPrice),
			showBothPrices: rate !== 100,
			rate: rate
		};
	}
	this.orderPay =	async function ({order_no}){
		vueGlobal.isLoading = true;
		let data = await theApiClient.callCafeApi('payOrder', 'POST', {order_no}).catch(ICafeApiError.show).finally(() => {
			vueGlobal.isLoading = false;
		});
		this.showPayOrder(data)
	},
	
	this.showPayOrder = async function(data,toOrder=false){
		if (typeof data.result == "undefined") {
			sweetAlert("",  data.message ?? translate_string( "Payment failed"), "error");
			return;
		}
		if (data.result != 1) {
			sweetAlert("", data.message, "error");
			return;
		}
		let qrEle = document.createElement('div')
		new QRCode(qrEle, data.url);
		// let qrImg = qrEle.querySelector('img')
		if (data.type == 'razorpay') {
			qrEle.innerHTML = `<div class="razorpay-qr-img"><img src="${data.url}" alt="Razorpay" /></div>`;
		}
		if (data.type == 'manual') {
			let payment_manual_tip1 = translate_string('Scan and pay ');
			let payment_manual_tip2 = translate_string('Contact the staff and confirm your payment.');
			qrEle.innerHTML = `<div>
				<ol class="text-left">
					<li>
					${payment_manual_tip1}<font color="red" size="3rem">${data.amount.toFixed(2)}</font>
					</li>
					<li>
					${payment_manual_tip2}
					</li>
				</ol>
				<img src="${data.payment_url}"/>
				</div>
			`;
		}
		if (data.type == 'paymongo') {
			qrEle.innerHTML = `<div><img src="${data.payment_url}" alt="QR Code" style="width:266px" /></div>`;
		}
		if (data.type == 'midtrans') {
			qrEle.innerHTML = `<div><img src="${data.payment_url}" alt="midtrans QR Code" style="width:266px" /></div>`;
		}
		if (data.type == 'finik') {
			qrEle.innerHTML = `<div><img src="${data.payment_url}" alt="Finik QR Code" style="width:266px; background-color: white;" /></div>`;
		}
		let gatewayEle = document.createElement('div') 
		gatewayEle.innerHTML = `<span class='text-uppercase'>--${data.type}--</span>`
		qrEle.appendChild(gatewayEle)
		qrEle.onclick = ()=>{
			navigator.clipboard.writeText(data.payment_url ?? data.url ?? null);
			show_toast(translate_string('Copied succeed'), { timeout: 2000, level: 'success' })
		}
		let btnOtps = {};
		if(toOrder && vueGlobal.showOrderList){
			btnOtps = {
				showCancelButton: true,
				cancelButtonText: translate_string("Close"),
				confirmButtonText: translate_string("Go to order"),
				closeOnConfirm: true,
				callback:confirm => confirm && customer_order_list()
			}
		}
		swal({title:translate_string('Pay Order'),text:'<div class="pay-order-box d-flex justify-content-center align-items-center" style="min-height: 280px;"></div>',html:true,...btnOtps},btnOtps.callback)
		document.querySelector('.pay-order-box').appendChild(qrEle)
		if (data.type == 'qris') {
		let checkStatus = async (times) => {
			if (times > 10) return;
			let url = "https://" + licenseServerCode + ".icafecloud.com/api/v2/cafe/" + iCafeId + "/getTopupStatus";
			let order = await $.ajax({
				url: url,
				method: "get",
				data: { order_no: data.order_no, t: data.t, sid: data.sid },
				dataType: "json"});
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

function Tax()
{
	// get sale price with tax
	this.getPriceWithTax = function(product_tax_id, price) {
		var taxs = {
			tax1_name: theSettings.tax1_name,
			tax1_percentage: theSettings.tax1_percentage,
			tax2_name: theSettings.tax2_name,
			tax2_percentage: theSettings.tax2_percentage,
			tax3_name: theSettings.tax3_name,
			tax3_percentage: theSettings.tax3_percentage,
			tax4_name: theSettings.tax4_name,
			tax4_percentage: theSettings.tax4_percentage,
			tax_included_in_price: theSettings.tax_included_in_price,
		};
		price = parseFloat(price);
		if (taxs.tax_included_in_price == 1)
			return price.toFixed(2).replace('.00', '');

		var tax_percentage = 0;
		if (product_tax_id == 1)
			tax_percentage = taxs.tax1_percentage / 100.0;
		if (product_tax_id == 2)
			tax_percentage = taxs.tax2_percentage / 100.0;
		if (product_tax_id == 3)
			tax_percentage = taxs.tax3_percentage / 100.0;
		if (product_tax_id == 4)
			tax_percentage = taxs.tax4_percentage / 100.0;

		if (tax_percentage <= 0)
			return price.toFixed(2).replace('.00', '');

		return (price * (1 + tax_percentage)).toFixed(2).replace('.00', '');
	}

	// get tax by price
	this.getTaxWithPrice = function(product_tax_id, price) {
		var taxs = {
			tax1_name: theSettings.tax1_name,
			tax1_percentage: theSettings.tax1_percentage,
			tax2_name: theSettings.tax2_name,
			tax2_percentage: theSettings.tax2_percentage,
			tax3_name: theSettings.tax3_name,
			tax3_percentage: theSettings.tax3_percentage,
			tax4_name: theSettings.tax4_name,
			tax4_percentage: theSettings.tax4_percentage,
			tax_included_in_price: theSettings.tax_included_in_price,
		};
		price = parseFloat(price);
		var tax_percentage = 0;
		if (product_tax_id == 1)
			tax_percentage = taxs.tax1_percentage / 100.0;
		if (product_tax_id == 2)
			tax_percentage = taxs.tax2_percentage / 100.0;
		if (product_tax_id == 3)
			tax_percentage = taxs.tax3_percentage / 100.0;
		if (product_tax_id == 4)
			tax_percentage = taxs.tax4_percentage / 100.0;

		if (tax_percentage <= 0)
			return 0;

		// if price include tax
		if (taxs.tax_included_in_price == 1)
			return (price / ( 1 + tax_percentage) * tax_percentage).toFixed(2);

		return (price * tax_percentage).toFixed(2);
	}
}

function ShopPrint()
{
	this.order_items = []
	this.loaded = false
	var that = this

	this.setup = function (page_count) {
		theProductList.forEach(function (obj) {
			if (obj.product_id == "p--3") vuePrint.blackwhite = obj
			if (obj.product_id == "p--4") vuePrint.color = obj
		})
		if (vuePrint.blackwhite == null || vuePrint.color == null) return

		vuePrint.product_id = vuePrint.blackwhite.product_id
		vuePrint.page_count = page_count
		this.cart_refresh()
	}

	this.cart_refresh = function () {
		vuePrint.total_cost = 0
		vuePrint.total_tax = 0
		vuePrint.total_amount = 0
		vuePrint.total_discount = 0
		vuePrint.member_group_id = thePCStatus.member_group_id
		vuePrint.member_group_discount_rate = thePCStatus.member_group_discount_rate ?? 0
		vuePrint.member_group_discount_offer = thePCStatus.member_group_discount_offer ?? 0
		
		vueOrderItems.enable_cash = 1
		vueOrderItems.enable_qr = 1
		vueOrderItems.enable_credit_card = 1
		vueOrderItems.enable_balance = 1
		vueOrderItems.enable_pay_later = theShop.get_member_pay_later_status();

		let total_offer = 0
		let product_count = 0

		let product_item = vuePrint.blackwhite
		if (vuePrint.product_id == vuePrint.color.product_id) 
			product_item = vuePrint.color
		this.order_items = []

		this.order_items.push({
			product_id: product_item.product_id,
			product_name: product_item.product_name,
			product_tax_id: product_item.product_tax_id,
			product_price: product_item.product_price,
			product_enable_discount: product_item.product_enable_discount,
			product_is_offer: false,
			order_item_qty: vuePrint.page_count,
		})

		for (var i = 0; i < this.order_items.length; i++) {
			this.order_items[i].order_cost = this.order_items[i].product_price * this.order_items[i].order_item_qty
			var order_discount = this.order_items[i].product_is_offer ? vuePrint.member_group_discount_offer : vuePrint.member_group_discount_rate
			if (!this.order_items[i].product_enable_discount) order_discount = 0
			var order_tax = theTax.getTaxWithPrice(this.order_items[i].product_tax_id, this.order_items[i].order_cost * (1 - order_discount / 100.0))
			if (vuePrint.payment_method == PAY_METHOD_BALANCE) order_tax = 0
			vuePrint.total_cost += parseFloat(this.order_items[i].order_cost)
			vuePrint.total_tax += parseFloat(order_tax)
			vuePrint.total_discount += (parseFloat(this.order_items[i].order_cost) * order_discount) / 100.0
			vuePrint.total_amount += this.order_items[i].order_cost * (1 - order_discount / 100.0)
			vuePrint.total_offer += this.order_items[i].order_cost
			if (this.order_items[i].product_is_offer) {
				total_offer += this.order_items[i].order_cost * (1 - order_discount / 100.0)
			} else {
				product_count++
			}
			if (theSettings.tax_included_in_price == 0) vuePrint.total_amount += parseFloat(order_tax)
		}
		let max_bonuses =
			theSettings.bonus_buy_offer === 1 && theSettings.max_bonus_percentage > 0 ? Math.min((total_offer * theSettings.max_bonus_percentage) / 100, memberInfo.member_balance_bonus) : 0

		let cost_bonus = vuePrint.total_amount <= memberInfo.member_balance ? 0 : max_bonuses //pay balance first
		if (theSettings.use_bonus_first) {
			cost_bonus = max_bonuses
		}
		vuePrint.max_bonuses = cost_bonus
		vuePrint.payable_balance = vuePrint.total_amount - vuePrint.max_bonuses
		vuePrint.product_count = product_count

		vuePrint.items = JSON.parse(JSON.stringify(this.order_items))

		vueOrderItems.enable_cash = this.enable_credit_card = this.enable_balance = vueOrderItems.enable_qr = 1

		for (var i = 0; i < this.order_items.length; i++) {
			product_item = null
			theProductList.forEach(function (obj) {
				if (obj.product_id == that.order_items[i].product_id) product_item = obj
			})
			if (product_item == null) continue
			if (typeof product_item.product_group_payment_method == "undefined") continue
			product_group_payment_method = JSON.parse(product_item.product_group_payment_method)
			product_group_payment_method = is_member_logined() ? product_group_payment_method.member : product_group_payment_method.guest
			if (vueOrderItems.enable_cash && product_group_payment_method.indexOf("cash") < 0) vueOrderItems.enable_cash = 0
			if (vueOrderItems.enable_qr && product_group_payment_method.indexOf("qr") < 0) vueOrderItems.enable_qr = 0
			if (vueOrderItems.enable_credit_card && product_group_payment_method.indexOf("credit_card") < 0) vueOrderItems.enable_credit_card = 0
			if (vueOrderItems.enable_balance && product_group_payment_method.indexOf("balance") < 0) vueOrderItems.enable_balance = 0
			if(vueOrderItems.enable_pay_later && product_group_payment_method.indexOf('pay_later') < 0)
				vueOrderItems.enable_pay_later = 0;
		}

		PetiteVue.nextTick(() => {
			ui_init()
			$('[data-toggle="tooltip"]').tooltip()
		})
	}

	this.cart_done = async function () {
		if (vuePrint.payment_method == -1) {
			sweetAlert("", translate_string("Please choose a payment method"), "error")
			return
		}

		var items = []
		that.order_items.forEach(function (obj) {
			items.push({
				product_id: obj.product_id,
				qty: obj.order_item_qty,
			})
		})

		const token = await theApiClient.getToken()
		if (!token) {
			vueGlobal.modals.print = false;
			return
		}

		vueGlobal.isLoading = true;
		let data = await theApiClient.callCafeApi('submitOrder', 'POST', {
			payment_method: vuePrint.payment_method,
			member_group_discount_rate: thePCStatus.member_group_discount_rate ?? 0,
			member_group_discount_offer: thePCStatus.member_group_discount_offer ?? 0,
			items: items,
			pc_name: thePCInfo.pc_name,
		}).catch(ICafeApiError.show).finally(() => {
			vueGlobal.isLoading = false;
			vueGlobal.modals.print = false;
		});
		if(!data){
			return
		}

		ICAFEMENU_CORE.callFun("PROCESS_PRINT_PDF " + data.order_no)
		if(data.order_status == ORDER_STATUS_DONE)
		{
			var cmd = {
				action: 'print',
				version: 2,
				type: 'request',
				from: 'client',
				target: 'server',
				data: {
					order_no: data.order_no,
					pc_name: thePCInfo.pc_name,
					is_color: vuePrint.product_id == vuePrint.color.product_id ? 1 : 0,
				}
			};

			ICAFEMENU_CORE.callFun('WSSSEND ' + JSON.stringify(cmd));
		}
		toast(translate_string("Your order submitted"))
	}
}
