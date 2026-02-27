/**
 * 图片处理模块
 */

const ImageModule = {
	/**
	 * 选择图片文件
	 */
	async selectImage() {
		try {
			const file = await eda.sys_FileSystem.openReadFileDialog(['png', 'jpg', 'jpeg', 'bmp', 'webp', 'svg'], false);

			if (!file) {
				eda.sys_Message.showToastMessage('未选择文件', 'warn');
				return;
			}

			const fileName = file.name || '';
			const fileExtension = fileName.split('.').pop()?.toLowerCase();
			const supportedFormats = ['png', 'jpg', 'jpeg', 'bmp', 'webp', 'svg'];

			if (!fileExtension || !supportedFormats.includes(fileExtension)) {
				eda.sys_Message.showToastMessage('暂不支持该格式的图片，请选择PNG/JPG/JPEG/BMP/WEBP/SVG格式', 'error');
				return;
			}

			AppState.currentImageFile = file;
			AppState.selectedPolygons = [];

			await this.loadAndConvertImage();

			eda.sys_Message.showToastMessage('图片加载成功，点击轮廓进行选择', 'success');
		} catch (err) {
			eda.sys_Message.showToastMessage('选择文件失败: ' + err, 'error');
		}
	},

	/**
	 * 加载图片并转换为多边形
	 */
	async loadAndConvertImage() {
		const img = new Image();
		const url = URL.createObjectURL(AppState.currentImageFile);
		
		await new Promise((resolve, reject) => {
			img.onload = resolve;
			img.onerror = reject;
			img.src = url;
		});

		AppState.imageWidth = img.naturalWidth;
		AppState.imageHeight = img.naturalHeight;

		AppState.polygonData = await eda.pcb_MathPolygon.convertImageToComplexPolygon(
			AppState.currentImageFile,
			AppState.imageWidth,
			AppState.imageHeight,
			0.35
		);

		if (AppState.polygonData && AppState.polygonData.complexPolygon && AppState.polygonData.complexPolygon.length > 0) {
			let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
			
			AppState.polygonData.complexPolygon.forEach(polygon => {
				for (let i = 0; i < polygon.length; i++) {
					if (polygon[i] === 'L') {
						continue;
					} else if (typeof polygon[i] === 'number') {
						const x = polygon[i];
						if (i + 1 < polygon.length && typeof polygon[i + 1] === 'number') {
							const y = polygon[i + 1];
							minX = Math.min(minX, x);
							maxX = Math.max(maxX, x);
							minY = Math.min(minY, y);
							maxY = Math.max(maxY, y);
							i++;
						}
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

		CanvasModule.drawImageAndPolygons(img);

		URL.revokeObjectURL(url);
	}
};

window.ImageModule = ImageModule;
