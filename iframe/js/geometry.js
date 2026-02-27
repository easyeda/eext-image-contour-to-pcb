/**
 * 几何计算工具模块
 */

const GeometryUtils = {
	/**
	 * 计算多边形面积
	 */
	calculatePolygonArea(polygon) {
		if (!window.polygonBounds) return 0;
		
		const points = [];
		const { minX, maxY } = window.polygonBounds;
		
		for (let i = 0; i < polygon.length; i++) {
			if (polygon[i] === 'L') {
				continue;
			} else if (typeof polygon[i] === 'number') {
				const xMM = polygon[i];
				if (i + 1 < polygon.length && typeof polygon[i + 1] === 'number') {
					const yMM = polygon[i + 1];
					
					const xPixel = (xMM - minX) * AppState.baseDisplayScale;
					const yPixel = (maxY - yMM) * AppState.baseDisplayScale;
					
					points.push({ x: xPixel, y: yPixel });
					i++;
				}
			}
		}

		if (points.length < 3) return 0;

		let area = 0;
		for (let i = 0; i < points.length; i++) {
			const j = (i + 1) % points.length;
			area += points[i].x * points[j].y;
			area -= points[j].x * points[i].y;
		}
		return Math.abs(area / 2);
	},

	/**
	 * 判断点是否在多边形内
	 */
	isPointInPolygon(x, y, polygon) {
		if (!window.polygonBounds) return false;
		
		let inside = false;
		const points = [];
		
		const { minX, maxY } = window.polygonBounds;
		
		for (let i = 0; i < polygon.length; i++) {
			if (polygon[i] === 'L') {
				continue;
			} else if (typeof polygon[i] === 'number') {
				const xMM = polygon[i];
				if (i + 1 < polygon.length && typeof polygon[i + 1] === 'number') {
					const yMM = polygon[i + 1];
					
					const xPixel = (xMM - minX) * AppState.baseDisplayScale;
					const yPixel = (maxY - yMM) * AppState.baseDisplayScale;
					
					points.push({ x: xPixel, y: yPixel });
					i++;
				}
			}
		}

		if (points.length < 3) return false;

		for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
			const xi = points[i].x, yi = points[i].y;
			const xj = points[j].x, yj = points[j].y;

			const intersect = ((yi > y) !== (yj > y)) &&
				(x < (xj - xi) * (y - yi) / (yj - yi) + xi);
			if (intersect) inside = !inside;
		}

		return inside;
	},

	/**
	 * 计算多边形的边界框
	 */
	calculatePolygonBounds(polygon) {
		if (!window.polygonBounds) return { width: 0, height: 0 };
		
		let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
		
		for (let i = 0; i < polygon.length; i++) {
			if (polygon[i] === 'L') {
				continue;
			} else if (typeof polygon[i] === 'number') {
				const xMM = polygon[i];
				if (i + 1 < polygon.length && typeof polygon[i + 1] === 'number') {
					const yMM = polygon[i + 1];
					minX = Math.min(minX, xMM);
					maxX = Math.max(maxX, xMM);
					minY = Math.min(minY, yMM);
					maxY = Math.max(maxY, yMM);
					i++;
				}
			}
		}
		
		return {
			width: maxX - minX,
			height: maxY - minY,
			minX: minX,
			maxX: maxX,
			minY: minY,
			maxY: maxY
		};
	},

	/**
	 * 缩放多边形（直接缩放坐标）
	 */
	scalePolygon(polygon, scaleX, scaleY) {
		const scaledPolygon = [];
		
		for (let i = 0; i < polygon.length; i++) {
			if (polygon[i] === 'L') {
				scaledPolygon.push('L');
			} else if (typeof polygon[i] === 'number') {
				const x = polygon[i];
				if (i + 1 < polygon.length && typeof polygon[i + 1] === 'number') {
					const y = polygon[i + 1];
					
					const newX = x * scaleX;
					const newY = y * scaleY;
					
					scaledPolygon.push(newX);
					scaledPolygon.push(newY);
					i++;
				} else {
					scaledPolygon.push(x);
				}
			}
		}
		
		return scaledPolygon;
	}
};

window.GeometryUtils = GeometryUtils;
