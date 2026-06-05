/**
 * 事件处理模块
 */

const EventHandlers = {
	/**
	 * 处理滚轮缩放
	 */
	handleWheel(event) {
		event.preventDefault();
		
		const canvas = AppState.canvas;
		const rect = canvas.getBoundingClientRect();
		const mouseX = event.clientX - rect.left;
		const mouseY = event.clientY - rect.top;
		
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;
		
		const canvasMouseX = mouseX * scaleX;
		const canvasMouseY = mouseY * scaleY;
		
		const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
		const newZoomLevel = AppState.zoomLevel * zoomFactor;
		
		if (newZoomLevel < 0.1 || newZoomLevel > 30) {
			return;
		}
		
		const zoomPointX = (canvasMouseX - AppState.panX) / AppState.zoomLevel;
		const zoomPointY = (canvasMouseY - AppState.panY) / AppState.zoomLevel;
		
		AppState.zoomLevel = newZoomLevel;
		AppState.panX = canvasMouseX - zoomPointX * AppState.zoomLevel;
		AppState.panY = canvasMouseY - zoomPointY * AppState.zoomLevel;
		
		document.getElementById('zoomInfo').textContent = t('ZoomLevel', Math.round(AppState.zoomLevel * 100));
		
		CanvasModule.redrawCanvas();
	},

	/**
	 * 处理鼠标按下
	 */
	handleMouseDown(event) {
		if (event.button === 0) {
			AppState.isDragging = true;
			AppState.hasMoved = false;
			AppState.lastMouseX = event.clientX;
			AppState.lastMouseY = event.clientY;
			AppState.dragStartX = event.clientX;
			AppState.dragStartY = event.clientY;
			AppState.canvas.style.cursor = 'crosshair';
		}
	},

	/**
	 * 处理鼠标移动
	 */
	handleMouseMove(event) {
		if (AppState.isDragging) {
			const deltaX = event.clientX - AppState.lastMouseX;
			const deltaY = event.clientY - AppState.lastMouseY;
			
			const totalDeltaX = Math.abs(event.clientX - AppState.dragStartX);
			const totalDeltaY = Math.abs(event.clientY - AppState.dragStartY);
			if (totalDeltaX > 5 || totalDeltaY > 5) {
				AppState.hasMoved = true;
			}
			
			AppState.panX += deltaX;
			AppState.panY += deltaY;
			
			AppState.lastMouseX = event.clientX;
			AppState.lastMouseY = event.clientY;
			
			CanvasModule.redrawCanvas();
		}
	},

	/**
	 * 处理鼠标释放
	 */
	handleMouseUp(event) {
		AppState.isDragging = false;
		AppState.canvas.style.cursor = 'crosshair';
	},

	/**
	 * 处理 Canvas 点击事件
	 */
	handleCanvasClick(event) {
		if (AppState.hasMoved) {
			return;
		}
		
		if (!AppState.polygonData || !AppState.polygonData.complexPolygon) return;

		const canvas = AppState.canvas;
		const rect = canvas.getBoundingClientRect();
		
		const canvasX = event.clientX - rect.left;
		const canvasY = event.clientY - rect.top;
		
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;
		
		const canvasPixelX = canvasX * scaleX;
		const canvasPixelY = canvasY * scaleY;
		
		const clickX = (canvasPixelX - AppState.panX) / AppState.zoomLevel;
		const clickY = (canvasPixelY - AppState.panY) / AppState.zoomLevel;

		AppState.debugClickPoint = { x: clickX, y: clickY };

		const matchedPolygons = [];
		for (let i = 0; i < AppState.polygonData.complexPolygon.length; i++) {
			if (GeometryUtils.isPointInPolygon(clickX, clickY, AppState.polygonData.complexPolygon[i])) {
				const area = GeometryUtils.calculatePolygonArea(AppState.polygonData.complexPolygon[i]);
				matchedPolygons.push({ index: i, area: area });
			}
		}

		if (matchedPolygons.length > 0) {
			matchedPolygons.sort((a, b) => a.area - b.area);
			PolygonManager.togglePolygonSelection(matchedPolygons[0].index);
		} else {
			CanvasModule.redrawCanvas();
		}
	}
};

window.EventHandlers = EventHandlers;
