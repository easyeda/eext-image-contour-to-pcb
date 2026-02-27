/**
 * 全局状态管理
 */

// 图片和多边形数据
let currentImageFile = null;
let polygonData = null;
let selectedPolygons = [];

// Canvas 相关
let canvas = null;
let ctx = null;
let imageWidth = 0;
let imageHeight = 0;

// 视图控制
let zoomLevel = 1;
let panX = 0;
let panY = 0;
let baseDisplayScale = 1;

// 交互状态
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;
let dragStartX = 0;
let dragStartY = 0;
let hasMoved = false;
let debugClickPoint = null;

// 全局尺寸设置
let globalWidth = 0;
let globalHeight = 0;
let globalOriginalWidth = 0;
let globalOriginalHeight = 0;
let globalAspectRatioLocked = true;
let currentUnit = 'mil';

// 导出状态
window.AppState = {
	// 图片和多边形数据
	get currentImageFile() { return currentImageFile; },
	set currentImageFile(value) { currentImageFile = value; },
	
	get polygonData() { return polygonData; },
	set polygonData(value) { polygonData = value; },
	
	get selectedPolygons() { return selectedPolygons; },
	set selectedPolygons(value) { selectedPolygons = value; },
	
	// Canvas 相关
	get canvas() { return canvas; },
	set canvas(value) { canvas = value; },
	
	get ctx() { return ctx; },
	set ctx(value) { ctx = value; },
	
	get imageWidth() { return imageWidth; },
	set imageWidth(value) { imageWidth = value; },
	
	get imageHeight() { return imageHeight; },
	set imageHeight(value) { imageHeight = value; },
	
	// 视图控制
	get zoomLevel() { return zoomLevel; },
	set zoomLevel(value) { zoomLevel = value; },
	
	get panX() { return panX; },
	set panX(value) { panX = value; },
	
	get panY() { return panY; },
	set panY(value) { panY = value; },
	
	get baseDisplayScale() { return baseDisplayScale; },
	set baseDisplayScale(value) { baseDisplayScale = value; },
	
	// 交互状态
	get isDragging() { return isDragging; },
	set isDragging(value) { isDragging = value; },
	
	get lastMouseX() { return lastMouseX; },
	set lastMouseX(value) { lastMouseX = value; },
	
	get lastMouseY() { return lastMouseY; },
	set lastMouseY(value) { lastMouseY = value; },
	
	get dragStartX() { return dragStartX; },
	set dragStartX(value) { dragStartX = value; },
	
	get dragStartY() { return dragStartY; },
	set dragStartY(value) { dragStartY = value; },
	
	get hasMoved() { return hasMoved; },
	set hasMoved(value) { hasMoved = value; },
	
	get debugClickPoint() { return debugClickPoint; },
	set debugClickPoint(value) { debugClickPoint = value; },
	
	// 全局尺寸设置
	get globalWidth() { return globalWidth; },
	set globalWidth(value) { globalWidth = value; },
	
	get globalHeight() { return globalHeight; },
	set globalHeight(value) { globalHeight = value; },
	
	get globalOriginalWidth() { return globalOriginalWidth; },
	set globalOriginalWidth(value) { globalOriginalWidth = value; },
	
	get globalOriginalHeight() { return globalOriginalHeight; },
	set globalOriginalHeight(value) { globalOriginalHeight = value; },
	
	get globalAspectRatioLocked() { return globalAspectRatioLocked; },
	set globalAspectRatioLocked(value) { globalAspectRatioLocked = value; },
	
	get currentUnit() { return currentUnit; },
	set currentUnit(value) { currentUnit = value; }
};
