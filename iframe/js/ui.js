/**
 * UI 控制模块
 */

const UIModule = {
	/**
	 * 更新单位
	 */
	updateUnit() {
		const newUnit = document.getElementById('unitSelect').value;
		const oldUnit = AppState.currentUnit;
		
		if (newUnit === oldUnit) return;
		
		const conversionFactor = newUnit === 'mm' ? (1 / 39.3701) : 39.3701;
		
		if (AppState.globalWidth > 0) {
			AppState.globalWidth *= conversionFactor;
			AppState.globalOriginalWidth *= conversionFactor;
			document.getElementById('globalWidth').value = AppState.globalWidth.toFixed(3);
		}
		
		if (AppState.globalHeight > 0) {
			AppState.globalHeight *= conversionFactor;
			AppState.globalOriginalHeight *= conversionFactor;
			document.getElementById('globalHeight').value = AppState.globalHeight.toFixed(3);
		}
		
		AppState.selectedPolygons.forEach(item => {
			item.width *= conversionFactor;
			item.height *= conversionFactor;
			item.originalWidth *= conversionFactor;
			item.originalHeight *= conversionFactor;
			if (item.lineWidth > 0) {
				item.lineWidth *= conversionFactor;
			}
		});
		
		document.getElementById('widthUnit').textContent = newUnit;
		document.getElementById('heightUnit').textContent = newUnit;
		
		AppState.currentUnit = newUnit;
		
		PolygonManager.updateSelectedList();
	},

	/**
	 * 切换全局宽高比锁定状态
	 */
	toggleGlobalLock() {
		AppState.globalAspectRatioLocked = !AppState.globalAspectRatioLocked;
		const lockIcon = document.getElementById('globalLock');
		if (AppState.globalAspectRatioLocked) {
			lockIcon.textContent = '🔒';
			lockIcon.classList.remove('unlocked');
			lockIcon.title = '点击解锁宽高比';
		} else {
			lockIcon.textContent = '🔓';
			lockIcon.classList.add('unlocked');
			lockIcon.title = '点击锁定宽高比';
		}
	},

	/**
	 * 更新全局尺寸
	 */
	updateGlobalSize(dimension, value) {
		const newValue = parseFloat(value);
		
		if (newValue <= 0 || isNaN(newValue)) {
			document.getElementById('globalWidth').value = AppState.globalWidth.toFixed(3);
			document.getElementById('globalHeight').value = AppState.globalHeight.toFixed(3);
			return;
		}
		
		if (dimension === 'width') {
			AppState.globalWidth = newValue;
			
			if (AppState.globalAspectRatioLocked && AppState.globalOriginalWidth > 0) {
				const aspectRatio = AppState.globalOriginalHeight / AppState.globalOriginalWidth;
				AppState.globalHeight = AppState.globalWidth * aspectRatio;
				document.getElementById('globalHeight').value = AppState.globalHeight.toFixed(3);
			}
		} else if (dimension === 'height') {
			AppState.globalHeight = newValue;
			
			if (AppState.globalAspectRatioLocked && AppState.globalOriginalHeight > 0) {
				const aspectRatio = AppState.globalOriginalWidth / AppState.globalOriginalHeight;
				AppState.globalWidth = AppState.globalHeight * aspectRatio;
				document.getElementById('globalWidth').value = AppState.globalWidth.toFixed(3);
			}
		}
		
		const scaleX = AppState.globalWidth / AppState.globalOriginalWidth;
		const scaleY = AppState.globalHeight / AppState.globalOriginalHeight;
		
		this.applyGlobalScaleToSelected(scaleX, scaleY);
	},

	/**
	 * 将全局缩放比例应用到所有选中的轮廓
	 */
	applyGlobalScaleToSelected(scaleX, scaleY) {
		if (AppState.selectedPolygons.length === 0) return;
		
		AppState.selectedPolygons.forEach(item => {
			item.width = item.originalWidth * scaleX;
			item.height = item.originalHeight * scaleY;
		});
		
		PolygonManager.updateSelectedList();
	}
};

window.UIModule = UIModule;
