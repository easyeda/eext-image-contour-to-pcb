/**
 * 多边形管理模块
 */

const PolygonManager = {
	/**
	 * 切换多边形选择状态
	 */
	togglePolygonSelection(index) {
		const existingIndex = AppState.selectedPolygons.findIndex(item => item.index === index);
		const selectedLayer = parseInt(document.getElementById('layerSelect').value);

		if (existingIndex >= 0) {
			AppState.selectedPolygons.splice(existingIndex, 1);
		} else {
			const bounds = GeometryUtils.calculatePolygonBounds(AppState.polygonData.complexPolygon[index]);
			
			const unitConversionFactor = AppState.currentUnit === 'mm' ? (1 / 39.3701) : 1;
			const boundsWidth = bounds.width * unitConversionFactor;
			const boundsHeight = bounds.height * unitConversionFactor;
			
			let scaleX = 1;
			let scaleY = 1;
			if (AppState.globalOriginalWidth > 0 && AppState.globalOriginalHeight > 0) {
				scaleX = AppState.globalWidth / AppState.globalOriginalWidth;
				scaleY = AppState.globalHeight / AppState.globalOriginalHeight;
			}
			
			AppState.selectedPolygons.push({
				index: index,
				layer: selectedLayer,
				lineWidth: 0,
				width: boundsWidth * scaleX,
				height: boundsHeight * scaleY,
				originalWidth: boundsWidth,
				originalHeight: boundsHeight,
				aspectRatioLocked: true
			});
		}

		CanvasModule.redrawCanvas();
		this.updateSelectedList();
	},

	/**
	 * 更新选中列表显示
	 */
	updateSelectedList() {
		const selectedList = document.getElementById('selectedList');
		const selectedItems = document.getElementById('selectedItems');
		const selectedCount = document.getElementById('selectedCount');
		const mergeButton = document.getElementById('mergeButton');

		if (AppState.selectedPolygons.length === 0) {
			selectedList.style.display = 'none';
			mergeButton.disabled = true;
			return;
		}

		selectedList.style.display = 'block';
		selectedCount.textContent = AppState.selectedPolygons.length;
		mergeButton.disabled = AppState.selectedPolygons.length < 2;

		const layerSelect = document.getElementById('layerSelect');
		const layerOptions = Array.from(layerSelect.options).map(opt => ({
			value: opt.value,
			text: opt.text
		}));

		selectedItems.innerHTML = AppState.selectedPolygons.map((item, idx) => {
			const layerOptionsHtml = layerOptions.map(opt => 
				`<option value="${opt.value}" ${opt.value == item.layer ? 'selected' : ''}>${opt.text}</option>`
			).join('');

			const lockIcon = item.aspectRatioLocked ? '🔒' : '🔓';
			const lockClass = item.aspectRatioLocked ? 'locked' : '';

			return `
				<div class="selected-item">
					<div class="selected-item-header">
						<span class="selected-item-info">轮廓 ${item.index + 1}${item.isMerged ? ' (已合并)' : ''}</span>
						<span class="selected-item-remove" onclick="PolygonManager.removeSelection(${idx})">×</span>
					</div>
					<div class="selected-item-controls">
						<label>层:</label>
						<select onchange="PolygonManager.updatePolygonLayer(${idx}, this.value)">
							${layerOptionsHtml}
						</select>
						<label>线宽(为0时生成填充):</label>
						<input type="number" 
							value="${item.lineWidth || 0}" 
							min="0" 
							step="0.1"
							onchange="PolygonManager.updatePolygonLineWidth(${idx}, this.value)"
							title="0 表示填充，大于 0 表示轮廓线宽" />
						<span>${AppState.currentUnit}</span>
					</div>
					<div class="selected-item-size">
						<label>宽度:</label>
						<input type="number" 
							value="${item.width.toFixed(3)}" 
							min="0.001" 
							step="0.1"
							onchange="PolygonManager.updatePolygonWidth(${idx}, this.value)" />
						<span>${AppState.currentUnit}</span>
						<span class="lock-icon ${lockClass}" 
							onclick="PolygonManager.toggleAspectRatioLock(${idx})"
							title="${item.aspectRatioLocked ? '点击解锁宽高比' : '点击锁定宽高比'}">${lockIcon}</span>
						<label>高度:</label>
						<input type="number" 
							value="${item.height.toFixed(3)}" 
							min="0.001" 
							step="0.1"
							onchange="PolygonManager.updatePolygonHeight(${idx}, this.value)" />
						<span>${AppState.currentUnit}</span>
					</div>
				</div>
			`;
		}).join('');
	},

	/**
	 * 更新多边形的层
	 */
	updatePolygonLayer(idx, newLayer) {
		if (idx >= 0 && idx < AppState.selectedPolygons.length) {
			AppState.selectedPolygons[idx].layer = parseInt(newLayer);
		}
	},

	/**
	 * 更新多边形的线宽
	 */
	updatePolygonLineWidth(idx, newLineWidth) {
		if (idx >= 0 && idx < AppState.selectedPolygons.length) {
			AppState.selectedPolygons[idx].lineWidth = parseFloat(newLineWidth) || 0;
		}
	},

	/**
	 * 更新多边形的宽度
	 */
	updatePolygonWidth(idx, newWidth) {
		if (idx >= 0 && idx < AppState.selectedPolygons.length) {
			const item = AppState.selectedPolygons[idx];
			const width = parseFloat(newWidth);
			
			if (width <= 0 || isNaN(width)) {
				this.updateSelectedList();
				return;
			}
			
			item.width = width;
			
			if (item.aspectRatioLocked && item.originalWidth > 0) {
				const aspectRatio = item.originalHeight / item.originalWidth;
				item.height = width * aspectRatio;
			}
			
			this.updateSelectedList();
		}
	},

	/**
	 * 更新多边形的高度
	 */
	updatePolygonHeight(idx, newHeight) {
		if (idx >= 0 && idx < AppState.selectedPolygons.length) {
			const item = AppState.selectedPolygons[idx];
			const height = parseFloat(newHeight);
			
			if (height <= 0 || isNaN(height)) {
				this.updateSelectedList();
				return;
			}
			
			item.height = height;
			
			if (item.aspectRatioLocked && item.originalHeight > 0) {
				const aspectRatio = item.originalWidth / item.originalHeight;
				item.width = height * aspectRatio;
			}
			
			this.updateSelectedList();
		}
	},

	/**
	 * 切换宽高比锁定状态
	 */
	toggleAspectRatioLock(idx) {
		if (idx >= 0 && idx < AppState.selectedPolygons.length) {
			AppState.selectedPolygons[idx].aspectRatioLocked = !AppState.selectedPolygons[idx].aspectRatioLocked;
			this.updateSelectedList();
		}
	},

	/**
	 * 移除单个选择
	 */
	removeSelection(idx) {
		AppState.selectedPolygons.splice(idx, 1);
		CanvasModule.redrawCanvas();
		this.updateSelectedList();
	},

	/**
	 * 全选所有轮廓
	 */
	selectAll() {
		if (!AppState.polygonData || !AppState.polygonData.complexPolygon || AppState.polygonData.complexPolygon.length === 0) {
			eda.sys_Message.showToastMessage('没有可选择的轮廓', 'warn');
			return;
		}

		const selectedLayer = parseInt(document.getElementById('layerSelect').value);
		const unitConversionFactor = AppState.currentUnit === 'mm' ? (1 / 39.3701) : 1;
		
		let scaleX = 1;
		let scaleY = 1;
		if (AppState.globalOriginalWidth > 0 && AppState.globalOriginalHeight > 0) {
			scaleX = AppState.globalWidth / AppState.globalOriginalWidth;
			scaleY = AppState.globalHeight / AppState.globalOriginalHeight;
		}

		AppState.selectedPolygons = [];

		AppState.polygonData.complexPolygon.forEach((polygon, index) => {
			const bounds = GeometryUtils.calculatePolygonBounds(polygon);
			const boundsWidth = bounds.width * unitConversionFactor;
			const boundsHeight = bounds.height * unitConversionFactor;
			
			AppState.selectedPolygons.push({
				index: index,
				layer: selectedLayer,
				lineWidth: 0,
				width: boundsWidth * scaleX,
				height: boundsHeight * scaleY,
				originalWidth: boundsWidth,
				originalHeight: boundsHeight,
				aspectRatioLocked: true
			});
		});

		CanvasModule.redrawCanvas();
		this.updateSelectedList();
		
		eda.sys_Message.showToastMessage(`已选择所有 ${AppState.selectedPolygons.length} 个轮廓`, 'success');
	},

	/**
	 * 清除所有选择
	 */
	clearSelection() {
		AppState.selectedPolygons = [];
		CanvasModule.redrawCanvas();
		this.updateSelectedList();
		eda.sys_Message.showToastMessage('已清除所有选择', 'info');
	},

	/**
	 * 合并选中的轮廓
	 */
	async mergeSelected() {
		if (AppState.selectedPolygons.length < 2) {
			eda.sys_Message.showToastMessage('至少需要选择 2 个轮廓才能合并', 'warn');
			return;
		}

		try {
			const polygonsToMerge = AppState.selectedPolygons.map(item => 
				AppState.polygonData.complexPolygon[item.index]
			);

			const mergedComplexPolygon = await eda.pcb_MathPolygon.createComplexPolygon(polygonsToMerge);

			const firstItem = AppState.selectedPolygons[0];
			const mergedItem = {
				index: -1,
				layer: firstItem.layer,
				lineWidth: firstItem.lineWidth,
				width: firstItem.width,
				height: firstItem.height,
				originalWidth: firstItem.originalWidth,
				originalHeight: firstItem.originalHeight,
				aspectRatioLocked: firstItem.aspectRatioLocked,
				isMerged: true,
				mergedPolygons: mergedComplexPolygon.complexPolygon || polygonsToMerge
			};

			AppState.selectedPolygons = [mergedItem];

			CanvasModule.redrawCanvas();
			this.updateSelectedList();

			eda.sys_Message.showToastMessage(`成功合并 ${polygonsToMerge.length} 个轮廓`, 'success');
		} catch (err) {
			eda.sys_Message.showToastMessage('合并失败: ' + err, 'error');
		}
	}
};

window.PolygonManager = PolygonManager;
