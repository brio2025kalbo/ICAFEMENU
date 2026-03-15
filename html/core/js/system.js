function AudioSettings() 
{
	this.isDragging = false
	this.changeToHardwareTimeout = null
	this.currentTrack = null  // 存储当前正在拖动的轨道元素

	this.setup = () => {
		// 使用全局document事件监听鼠标移动和释放
		document.addEventListener("mousemove", (e) => {
			if (!this.isDragging || !this.currentTrack) return
			this.clientXChange(e.clientX)
		})

		document.addEventListener("mouseup", () => {
			this.isDragging = false
			this.currentTrack = null
		})
	}

	// 处理滑块手柄的mousedown事件（从模板调用）
	this.handleMouseDown = (e) => {
		this.isDragging = true
		// 从事件中获取轨道元素（手柄的父元素）
		this.currentTrack = e.target.closest('.volume-slider-track')
		e.preventDefault()
	}

	// 处理轨道点击事件（从模板调用）
	this.handleTrackClick = (e) => {
		const track = e.currentTarget
		const rect = track.getBoundingClientRect()
		let newVolume = Math.round(((e.clientX - rect.left) / rect.width) * 100)
		newVolume = Math.max(0, Math.min(100, newVolume))
		this.updateVolume(newVolume)
	}

	this.clientXChange = (x) => {
		// 使用存储的轨道元素引用，而非 querySelector
		if (!this.currentTrack) return
		
		const rect = this.currentTrack.getBoundingClientRect()
		let newVolume = Math.round(((x - rect.left) / rect.width) * 100)
		newVolume = Math.max(0, Math.min(100, newVolume))
		this.updateVolume(newVolume)
	}

	this.updateVolume = (newVolume) => {
		if (newVolume !== vueSystemSettings.volume) {
			vueSystemSettings.volume = newVolume
			vueSystemSettings.isMuted = false
			this.handleVolumeChange(newVolume)
		}
	}

	this.setVolumeMute = (volume, isMuted) => {
		vueSystemSettings.volume = volume
		vueSystemSettings.isMuted = isMuted
	}

	this.handleVolumeChange = (volume) => {
		this.handleChangeToHardware(volume, vueSystemSettings.isMuted);
	}

	this.toggleMute = () => {
		vueSystemSettings.isMuted = !vueSystemSettings.isMuted
		// 激活喇叭时设置音量为100%，禁止喇叭时设置音量为0%
		vueSystemSettings.volume = vueSystemSettings.isMuted ? 0 : 100
		this.handleChangeToHardware(vueSystemSettings.volume, vueSystemSettings.isMuted)
	}

	this.handleChangeToHardware = (volume, isMuted) => {
		if (this.changeToHardwareTimeout) {
			clearTimeout(this.changeToHardwareTimeout)
		}
		this.changeToHardwareTimeout = setTimeout(() => {
			CallFunction("VOLUME " + volume + " " + (isMuted ? "1" : "0"))
			this.changeToHardwareTimeout = null
		}, 500)
	}
}


function MouseSettings() {
	this.isDoubleClickDragging = false
	this.isMoveSpeedDragging = false
	this.doubleClickTimeout = null
	this.moveSpeedTimeout = null
	this.smoothnessTimeout = null
	this.doubleClickTrack = null  // 存储双击速度轨道元素
	this.moveSpeedTrack = null     // 存储移动速度轨道元素

	this.setup = () => {
		document.addEventListener("mousemove", (e) => {
			if (this.isDoubleClickDragging && this.doubleClickTrack) this.doubleClickXChange(e.clientX)
			if (this.isMoveSpeedDragging && this.moveSpeedTrack) this.moveSpeedXChange(e.clientX)
		})

		document.addEventListener("mouseup", () => {
			this.isDoubleClickDragging = false
			this.isMoveSpeedDragging = false
			this.doubleClickTrack = null
			this.moveSpeedTrack = null
		})
	}

	// 双击速度滑块事件处理（从模板调用）
	this.handleDoubleClickMouseDown = (e) => {
		this.isDoubleClickDragging = true
		this.doubleClickTrack = e.target.closest('.double-click-slider-track')
		e.preventDefault()
	}

	this.handleDoubleClickTrackClick = (e) => {
		const track = e.currentTarget
		const rect = track.getBoundingClientRect()
		let newSpeed = Math.round(((e.clientX - rect.left) / rect.width) * 10)
		newSpeed = Math.max(0, Math.min(10, newSpeed))
		this.updateDoubleClickSpeed(newSpeed)
	}

	// 移动速度滑块事件处理（从模板调用）
	this.handleMoveSpeedMouseDown = (e) => {
		this.isMoveSpeedDragging = true
		this.moveSpeedTrack = e.target.closest('.mouse-move-slider-track')
		e.preventDefault()
	}

	this.handleMoveSpeedTrackClick = (e) => {
		const track = e.currentTarget
		const rect = track.getBoundingClientRect()
		let newSpeed = Math.round(((e.clientX - rect.left) / rect.width) * 10)
		newSpeed = Math.max(0, Math.min(10, newSpeed))
		this.updateMoveSpeed(newSpeed)
	}

	this.doubleClickXChange = (x) => {
		// 使用存储的轨道元素引用
		if (!this.doubleClickTrack) return
		
		const rect = this.doubleClickTrack.getBoundingClientRect()
		let newSpeed = Math.round(((x - rect.left) / rect.width) * 10)
		newSpeed = Math.max(0, Math.min(10, newSpeed))
		this.updateDoubleClickSpeed(newSpeed)
	}

	this.updateDoubleClickSpeed = (newSpeed) => {
		if (newSpeed !== vueSystemSettings.doubleClickSpeed) {
			vueSystemSettings.doubleClickSpeed = newSpeed
			this.handleDoubleClickSpeedChange(newSpeed)
		}
	}

	this.setDoubleClickSpeed = (doubleClickSpeed) => {
		vueSystemSettings.doubleClickSpeed = doubleClickSpeed
	}

	this.handleDoubleClickSpeedChange = (doubleClickSpeed) => {
		if (this.doubleClickTimeout) {
			clearTimeout(this.doubleClickTimeout)
		}
		this.doubleClickTimeout = setTimeout(() => {
			CallFunction("MOUSE_DOUBLE_CLICK_SPEED " + doubleClickSpeed)
			this.doubleClickTimeout = null
		}, 500)
	}

	this.moveSpeedXChange = (x) => {
		// 使用存储的轨道元素引用
		if (!this.moveSpeedTrack) return
		
		const rect = this.moveSpeedTrack.getBoundingClientRect()
		let newSpeed = Math.round(((x - rect.left) / rect.width) * 10)
		newSpeed = Math.max(0, Math.min(10, newSpeed))
		this.updateMoveSpeed(newSpeed)
	}

	this.updateMoveSpeed = (newSpeed) => {
		if (newSpeed !== vueSystemSettings.moveSpeed) {
			vueSystemSettings.moveSpeed = newSpeed
			this.handleMoveSpeedChange(newSpeed)
		}
	}

	this.setMoveSpeed = (moveSpeed) => {
		vueSystemSettings.moveSpeed = moveSpeed
	}

	this.handleMoveSpeedChange = (moveSpeed) => {
		if (this.moveSpeedTimeout) {
			clearTimeout(this.moveSpeedTimeout)
		}
		this.moveSpeedTimeout = setTimeout(() => {
			CallFunction("MOUSE_MOVE_SPEED " + moveSpeed)
			this.moveSpeedTimeout = null
		}, 500)
	}

	this.setMouseSmoothness = (checked) => {
		vueSystemSettings.mouseSmoothness = checked
	}

	this.handleMouseSmoothnessChange = (checked) => {
		if (this.smoothnessTimeout) {
			clearTimeout(this.smoothnessTimeout)
		}
		this.smoothnessTimeout = setTimeout(() => {
			CallFunction("MOUSE_SMOOTHNESS " + (checked ? "1" : "0"))
			this.smoothnessTimeout = null
		}, 500)
	}
}
