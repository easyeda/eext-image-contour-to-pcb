/**
 * 图片处理模块
 */

const ImageModule = {
	_previewDebounceTimer: null,
	// 预览缩放状态
	_previewZoom: 1,
	_previewPanX: 0,
	_previewPanY: 0,
	_previewBaseScale: 1,
	_previewBounds: null,
	_previewPolygonData: null,
	_previewDragging: false,
	_previewLastX: 0,
	_previewLastY: 0,
	_previewEventsBound: false,

	/**
	 * 选择图片文件
	 */
	async selectImage() {
		try {
			const file = await eda.sys_FileSystem.openReadFileDialog(['png', 'jpg', 'jpeg', 'bmp', 'webp', 'svg'], false);

			if (!file) {
				eda.sys_Message.showToastMessage(t('NoFileSelected'), 'warn');
				return;
			}

			const fileName = file.name || '';
			const fileExtension = fileName.split('.').pop()?.toLowerCase();
			const supportedFormats = ['png', 'jpg', 'jpeg', 'bmp', 'webp', 'svg'];

			if (!fileExtension || !supportedFormats.includes(fileExtension)) {
				eda.sys_Message.showToastMessage(t('UnsupportedImageFormat'), 'error');
				return;
			}

			AppState.currentImageFile = file;
			AppState.selectedPolygons = [];

			// 加载图片尺寸
			const img = new Image();
			const url = URL.createObjectURL(file);
			await new Promise((resolve, reject) => {
				img.onload = resolve;
				img.onerror = reject;
				img.src = url;
			});
			URL.revokeObjectURL(url);

			AppState.imageWidth = img.naturalWidth;
			AppState.imageHeight = img.naturalHeight;

			// 显示参数编辑对话框
			this.showParamDialog();
		} catch (err) {
			eda.sys_Message.showToastMessage(t('FileSelectFailed', err), 'error');
		}
	},

	/**
	 * 显示参数编辑对话框
	 */
	showParamDialog() {
		// 重置参数为默认值
		document.getElementById('paramTolerance').value = 0.35;
		document.getElementById('paramToleranceVal').textContent = '0.35';
		document.getElementById('paramSimplification').value = 0;
		document.getElementById('paramSimplificationVal').textContent = '0';
		document.getElementById('paramSmoothing').value = 0;
		document.getElementById('paramSmoothingVal').textContent = '0';
		document.getElementById('paramDespeckling').value = 0;
		document.getElementById('paramDespecklingVal').textContent = '0';
		document.getElementById('paramWhiteBg').checked = true;
		document.getElementById('paramInversion').checked = false;

		// 重置预览缩放状态
		this._previewZoom = 1;
		this._previewPanX = 0;
		this._previewPanY = 0;
		this._previewPolygonData = null;
		this._previewBounds = null;

		document.getElementById('paramOverlay').classList.add('show');

		// 绑定预览 canvas 事件
		this._bindPreviewEvents();

		// 生成初始预览
		this.updatePreview();
	},

	/**
	 * 绑定预览 canvas 的缩放和拖拽事件
	 */
	_bindPreviewEvents() {
		if (this._previewEventsBound) return;
		const canvas = document.getElementById('paramPreviewCanvas');

		canvas.addEventListener('wheel', (e) => {
			e.preventDefault();
			const rect = canvas.getBoundingClientRect();
			const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
			const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);

			const factor = e.deltaY > 0 ? 0.9 : 1.1;
			const newZoom = ImageModule._previewZoom * factor;
			if (newZoom < 0.1 || newZoom > 30) return;

			const zoomPointX = (mouseX - ImageModule._previewPanX) / ImageModule._previewZoom;
			const zoomPointY = (mouseY - ImageModule._previewPanY) / ImageModule._previewZoom;

			ImageModule._previewZoom = newZoom;
			ImageModule._previewPanX = mouseX - zoomPointX * newZoom;
			ImageModule._previewPanY = mouseY - zoomPointY * newZoom;

			ImageModule.redrawPreview();
		}, { passive: false });

		canvas.addEventListener('mousedown', (e) => {
			if (e.button === 0) {
				ImageModule._previewDragging = true;
				ImageModule._previewLastX = e.clientX;
				ImageModule._previewLastY = e.clientY;
				canvas.style.cursor = 'grabbing';
			}
		});

		canvas.addEventListener('mousemove', (e) => {
			if (ImageModule._previewDragging) {
				ImageModule._previewPanX += e.clientX - ImageModule._previewLastX;
				ImageModule._previewPanY += e.clientY - ImageModule._previewLastY;
				ImageModule._previewLastX = e.clientX;
				ImageModule._previewLastY = e.clientY;
				ImageModule.redrawPreview();
			}
		});

		canvas.addEventListener('mouseup', () => {
			ImageModule._previewDragging = false;
			canvas.style.cursor = 'grab';
		});

		canvas.addEventListener('mouseleave', () => {
			ImageModule._previewDragging = false;
			canvas.style.cursor = 'grab';
		});

		canvas.style.cursor = 'grab';
		this._previewEventsBound = true;
	},

	/**
	 * 参数变化时触发（带防抖）
	 */
	onParamChange() {
		// 更新显示值
		const ids = ['Tolerance', 'Simplification', 'Smoothing', 'Despeckling'];
		ids.forEach(id => {
			const input = document.getElementById('param' + id);
			const valSpan = document.getElementById('param' + id + 'Val');
			valSpan.textContent = input.value;
		});

		// 防抖 300ms
		clearTimeout(ImageModule._previewDebounceTimer);
		ImageModule._previewDebounceTimer = setTimeout(() => {
			ImageModule.updatePreview();
		}, 300);
	},

	/**
	 * 获取当前参数值
	 */
	getParams() {
		const tolerance = parseFloat(document.getElementById('paramTolerance').value);
		const simplification = parseFloat(document.getElementById('paramSimplification').value);
		const smoothing = parseFloat(document.getElementById('paramSmoothing').value);
		const despeckling = parseFloat(document.getElementById('paramDespeckling').value);
		const whiteBg = document.getElementById('paramWhiteBg').checked;
		const inversion = document.getElementById('paramInversion').checked;
		return { tolerance, simplification, smoothing, despeckling, whiteBg, inversion };
	},

	/**
	 * 更新预览
	 */
	async updatePreview() {
		const loading = document.getElementById('paramLoading');
		loading.style.display = 'block';

		try {
			const params = this.getParams();
			const previewData = await eda.pcb_MathPolygon.convertImageToComplexPolygon(
				AppState.currentImageFile,
				AppState.imageWidth,
				AppState.imageHeight,
				params.tolerance,
				params.simplification,
				params.smoothing,
				params.despeckling,
				params.whiteBg,
				params.inversion
			);

			this.drawPreview(previewData);
		} catch (err) {
			// 预览失败时静默处理
		} finally {
			loading.style.display = 'none';
		}
	},

	/**
	 * 在预览 canvas 上绘制轮廓（初始化基础比例）
	 */
	drawPreview(polygonData) {
		this._previewPolygonData = polygonData;

		const canvas = document.getElementById('paramPreviewCanvas');
		const container = canvas.parentElement;
		canvas.width = container.clientWidth;
		canvas.height = container.clientHeight;

		if (!polygonData || !polygonData.complexPolygon || polygonData.complexPolygon.length === 0) {
			this._previewBounds = null;
			const ctx = canvas.getContext('2d');
			ctx.fillStyle = 'white';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = '#999';
			ctx.font = '13px "Segoe UI", sans-serif';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(t('NoContoursDetected'), canvas.width / 2, canvas.height / 2);
			return;
		}

		// 计算边界
		let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
		polygonData.complexPolygon.forEach(polygon => {
			for (let i = 0; i < polygon.length; i++) {
				if (polygon[i] === 'L') continue;
				if (typeof polygon[i] === 'number' && i + 1 < polygon.length && typeof polygon[i + 1] === 'number') {
					minX = Math.min(minX, polygon[i]);
					maxX = Math.max(maxX, polygon[i]);
					minY = Math.min(minY, polygon[i + 1]);
					maxY = Math.max(maxY, polygon[i + 1]);
					i++;
				}
			}
		});

		this._previewBounds = { minX, maxX, minY, maxY };

		const polyW = maxX - minX;
		const polyH = maxY - minY;
		if (polyW === 0 || polyH === 0) return;

		const padding = 20;
		const scaleX = (canvas.width - padding * 2) / polyW;
		const scaleY = (canvas.height - padding * 2) / polyH;
		this._previewBaseScale = Math.min(scaleX, scaleY);

		// 重置缩放，居中显示
		this._previewZoom = 1;
		const scaledW = polyW * this._previewBaseScale;
		const scaledH = polyH * this._previewBaseScale;
		this._previewPanX = (canvas.width - scaledW) / 2;
		this._previewPanY = (canvas.height - scaledH) / 2;

		this.redrawPreview();
	},

	/**
	 * 重绘预览（支持缩放和平移）
	 */
	redrawPreview() {
		const canvas = document.getElementById('paramPreviewCanvas');
		const ctx = canvas.getContext('2d');
		const data = this._previewPolygonData;
		const bounds = this._previewBounds;

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = 'white';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		if (!data || !data.complexPolygon || !bounds) return;

		ctx.save();
		ctx.translate(this._previewPanX, this._previewPanY);
		ctx.scale(this._previewZoom, this._previewZoom);

		const scale = this._previewBaseScale;
		ctx.strokeStyle = 'rgba(24, 144, 255, 0.8)';
		ctx.lineWidth = 1.5 / this._previewZoom;

		data.complexPolygon.forEach(polygon => {
			ctx.beginPath();
			let first = true;
			for (let i = 0; i < polygon.length; i++) {
				if (polygon[i] === 'L') continue;
				if (typeof polygon[i] === 'number' && i + 1 < polygon.length && typeof polygon[i + 1] === 'number') {
					const px = (polygon[i] - bounds.minX) * scale;
					const py = (bounds.maxY - polygon[i + 1]) * scale;
					if (first) {
						ctx.moveTo(px, py);
						first = false;
					} else {
						ctx.lineTo(px, py);
					}
					i++;
				}
			}
			ctx.closePath();
			ctx.stroke();
		});

		ctx.restore();

		// 显示轮廓数量和缩放比例
		ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
		ctx.font = '11px "Segoe UI", sans-serif';
		ctx.textAlign = 'left';
		ctx.textBaseline = 'top';
		ctx.fillText(t('ContourCountZoom', data.complexPolygon.length, Math.round(this._previewZoom * 100)), 8, 8);
	},

	/**
	 * 取消参数对话框
	 */
	cancelParamDialog() {
		document.getElementById('paramOverlay').classList.remove('show');
		AppState.currentImageFile = null;
	},

	/**
	 * 确认参数并进入轮廓选择
	 */
	async confirmParamDialog() {
		document.getElementById('paramOverlay').classList.remove('show');

		try {
			await this.loadAndConvertImage();
			eda.sys_Message.showToastMessage(t('ImageLoadedClickContour'), 'success');
		} catch (err) {
			eda.sys_Message.showToastMessage(t('LoadFailed', err), 'error');
		}
	},

	/**
	 * 加载图片并转换为多边形
	 */
	async loadAndConvertImage() {
		const params = this.getParams();

		AppState.polygonData = await eda.pcb_MathPolygon.convertImageToComplexPolygon(
			AppState.currentImageFile,
			AppState.imageWidth,
			AppState.imageHeight,
			params.tolerance,
			params.simplification,
			params.smoothing,
			params.despeckling,
			params.whiteBg,
			params.inversion
		);

		if (AppState.polygonData && AppState.polygonData.complexPolygon && AppState.polygonData.complexPolygon.length > 0) {
			let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

			AppState.polygonData.complexPolygon.forEach(polygon => {
				for (let i = 0; i < polygon.length; i++) {
					if (polygon[i] === 'L') continue;
					if (typeof polygon[i] === 'number' && i + 1 < polygon.length && typeof polygon[i + 1] === 'number') {
						minX = Math.min(minX, polygon[i]);
						maxX = Math.max(maxX, polygon[i]);
						minY = Math.min(minY, polygon[i + 1]);
						maxY = Math.max(maxY, polygon[i + 1]);
						i++;
					}
				}
			});

			window.polygonBounds = { minX, maxX, minY, maxY };

			AppState.globalOriginalWidth = maxX - minX;
			AppState.globalOriginalHeight = maxY - minY;
			AppState.globalWidth = AppState.globalOriginalWidth;
			AppState.globalHeight = AppState.globalOriginalHeight;

			document.getElementById('globalWidth').value = AppState.globalWidth.toFixed(3);
			document.getElementById('globalHeight').value = AppState.globalHeight.toFixed(3);
			document.getElementById('globalWidth').disabled = false;
			document.getElementById('globalHeight').disabled = false;
		}

		const img = new Image();
		CanvasModule.drawImageAndPolygons(img);
	}
};

window.ImageModule = ImageModule;
