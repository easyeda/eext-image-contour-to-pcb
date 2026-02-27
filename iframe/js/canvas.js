/**
 * Canvas 绘制和渲染模块
 */

const CanvasModule = {
	/**
	 * 初始化 Canvas
	 */
	initCanvas() {
		const canvas = document.getElementById('previewCanvas');
		const container = canvas.parentElement;
		
		canvas.width = container.clientWidth;
		canvas.height = container.clientHeight;
		
		const ctx = canvas.getContext('2d');
		ctx.fillStyle = 'white';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		
		ctx.fillStyle = '#999';
		ctx.font = '14px "Segoe UI", sans-serif';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('点击"选择图片"按钮开始', canvas.width / 2, canvas.height / 2);
	},

	/**
	 * 设置 Canvas 并绘制图片和轮廓
	 */
	drawImageAndPolygons(img) {
		const canvas = document.getElementById('previewCanvas');
		const ctx = canvas.getContext('2d');
		
		AppState.canvas = canvas;
		AppState.ctx = ctx;

		const container = canvas.parentElement;
		const containerWidth = container.clientWidth;
		const containerHeight = container.clientHeight;
		
		canvas.width = containerWidth;
		canvas.height = containerHeight;
		
		if (window.polygonBounds) {
			const { minX, maxX, minY, maxY } = window.polygonBounds;
			const polygonWidth = maxX - minX;
			const polygonHeight = maxY - minY;
			const polygonAspectRatio = polygonWidth / polygonHeight;
			const containerAspectRatio = containerWidth / containerHeight;
			
			if (polygonAspectRatio > containerAspectRatio) {
				AppState.baseDisplayScale = containerWidth / polygonWidth;
			} else {
				AppState.baseDisplayScale = containerHeight / polygonHeight;
			}
			
			const scaledWidth = polygonWidth * AppState.baseDisplayScale;
			const scaledHeight = polygonHeight * AppState.baseDisplayScale;
			AppState.panX = (containerWidth - scaledWidth) / 2;
			AppState.panY = (containerHeight - scaledHeight) / 2;
		} else {
			const imageAspectRatio = AppState.imageWidth / AppState.imageHeight;
			const containerAspectRatio = containerWidth / containerHeight;
			
			if (imageAspectRatio > containerAspectRatio) {
				AppState.baseDisplayScale = containerWidth / AppState.imageWidth;
			} else {
				AppState.baseDisplayScale = containerHeight / AppState.imageHeight;
			}
			
			const scaledWidth = AppState.imageWidth * AppState.baseDisplayScale;
			const scaledHeight = AppState.imageHeight * AppState.baseDisplayScale;
			AppState.panX = (containerWidth - scaledWidth) / 2;
			AppState.panY = (containerHeight - scaledHeight) / 2;
		}

		AppState.zoomLevel = 1;

		this.redrawCanvas();

		canvas.addEventListener('click', EventHandlers.handleCanvasClick);
		canvas.addEventListener('wheel', EventHandlers.handleWheel, { passive: false });
		canvas.addEventListener('mousedown', EventHandlers.handleMouseDown);
		canvas.addEventListener('mousemove', EventHandlers.handleMouseMove);
		canvas.addEventListener('mouseup', EventHandlers.handleMouseUp);
		canvas.addEventListener('mouseleave', EventHandlers.handleMouseUp);
	},

	/**
	 * 绘制单个多边形
	 */
	drawPolygon(polygon, highlight = false) {
		if (!polygon || polygon.length < 4 || !window.polygonBounds) return;

		const { minX, maxY } = window.polygonBounds;
		const ctx = AppState.ctx;

		ctx.beginPath();
		
		let firstPoint = true;
		
		for (let i = 0; i < polygon.length; i++) {
			if (polygon[i] === 'L') {
				continue;
			} else if (typeof polygon[i] === 'number') {
				const xMM = polygon[i];
				if (i + 1 < polygon.length && typeof polygon[i + 1] === 'number') {
					const yMM = polygon[i + 1];
					
					const xPixel = (xMM - minX) * AppState.baseDisplayScale;
					const yPixel = (maxY - yMM) * AppState.baseDisplayScale;
					
					if (firstPoint) {
						ctx.moveTo(xPixel, yPixel);
						firstPoint = false;
					} else {
						ctx.lineTo(xPixel, yPixel);
					}
					
					i++;
				}
			}
		}
		
		ctx.closePath();
		
		if (highlight) {
			ctx.fillStyle = 'rgba(24, 144, 255, 0.3)';
			ctx.fill();
		}
		ctx.stroke();
	},

	/**
	 * 重新绘制 Canvas
	 */
	redrawCanvas() {
		const canvas = AppState.canvas;
		const ctx = AppState.ctx;
		
		if (!canvas || !ctx) return;
		
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = 'white';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		
		ctx.save();
		ctx.translate(AppState.panX, AppState.panY);
		ctx.scale(AppState.zoomLevel, AppState.zoomLevel);
		
		if (AppState.polygonData && AppState.polygonData.complexPolygon && Array.isArray(AppState.polygonData.complexPolygon)) {
			AppState.polygonData.complexPolygon.forEach((polygon, index) => {
				const isSelected = AppState.selectedPolygons.some(item => item.index === index);
				if (isSelected) {
					ctx.strokeStyle = 'rgba(82, 196, 26, 1)';
					ctx.lineWidth = 3 / AppState.zoomLevel;
				} else {
					ctx.strokeStyle = 'rgba(24, 144, 255, 0.8)';
					ctx.lineWidth = 2 / AppState.zoomLevel;
				}
				this.drawPolygon(polygon, isSelected);
			});
		}
		
		if (AppState.debugClickPoint) {
			ctx.fillStyle = 'red';
			ctx.beginPath();
			ctx.arc(AppState.debugClickPoint.x, AppState.debugClickPoint.y, 5 / AppState.zoomLevel, 0, Math.PI * 2);
			ctx.fill();
			
			ctx.strokeStyle = 'red';
			ctx.lineWidth = 1 / AppState.zoomLevel;
			ctx.beginPath();
			ctx.moveTo(AppState.debugClickPoint.x - 10 / AppState.zoomLevel, AppState.debugClickPoint.y);
			ctx.lineTo(AppState.debugClickPoint.x + 10 / AppState.zoomLevel, AppState.debugClickPoint.y);
			ctx.moveTo(AppState.debugClickPoint.x, AppState.debugClickPoint.y - 10 / AppState.zoomLevel);
			ctx.lineTo(AppState.debugClickPoint.x, AppState.debugClickPoint.y + 10 / AppState.zoomLevel);
			ctx.stroke();
		}
		
		ctx.restore();
	}
};

window.CanvasModule = CanvasModule;
