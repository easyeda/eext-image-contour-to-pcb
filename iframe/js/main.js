/**
 * 主入口模块 - 初始化和全局函数映射
 */

// 页面加载时初始化
window.addEventListener('DOMContentLoaded', function() {
	CanvasModule.initCanvas();
});

// 全局函数映射 - 供 HTML onclick 调用
window.selectImage = () => ImageModule.selectImage();
window.updateUnit = () => UIModule.updateUnit();
window.toggleGlobalLock = () => UIModule.toggleGlobalLock();
window.updateGlobalSize = (dimension, value) => UIModule.updateGlobalSize(dimension, value);
window.selectAll = () => PolygonManager.selectAll();
window.clearSelection = () => PolygonManager.clearSelection();
window.mergeSelected = () => PolygonManager.mergeSelected();
window.generateFill = () => GeneratorModule.generateFill();
