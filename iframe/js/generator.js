/**
 * 图元生成模块
 */

const GeneratorModule = {
	/**
	 * 生成填充图元
	 */
	async generateFill() {
		if (!AppState.polygonData) {
			eda.sys_Message.showToastMessage('请先选择图片', 'warn');
			return;
		}

		if (AppState.selectedPolygons.length === 0) {
			eda.sys_Message.showToastMessage('请先选择要填充的轮廓', 'warn');
			return;
		}

		// 检查是否有板框层且线宽为0的情况
		const boardOutlineWithFill = AppState.selectedPolygons.find(item => item.layer === 11 && item.lineWidth === 0);
		if (boardOutlineWithFill) {
			eda.sys_Message.showToastMessage('板框层不支持填充，请设置线宽大于0', 'error');
			return;
		}

		// 检查是否有多层且线宽大于0的情况
		const multiLayerWithLine = AppState.selectedPolygons.find(item => item.layer === 12 && item.lineWidth > 0);
		if (multiLayerWithLine) {
			eda.sys_Message.showToastMessage('多层不支持线条，请设置线宽为0', 'error');
			return;
		}

		try {
			const primitives = [];
			let fillCount = 0;
			let outlineCount = 0;

			for (const item of AppState.selectedPolygons) {
				if (item.isMerged && item.mergedPolygons) {
					const scaleX = item.width / item.originalWidth;
					const scaleY = item.height / item.originalHeight;
					
					const scaledPolygons = item.mergedPolygons.map(poly => {
						if (Math.abs(scaleX - 1) > 0.001 || Math.abs(scaleY - 1) > 0.001) {
							return GeometryUtils.scalePolygon(poly, scaleX, scaleY);
						}
						return poly;
					});
					
					if (item.lineWidth > 0) {
						for (const scaledPolygon of scaledPolygons) {
							const complexPolygonObj = await eda.pcb_MathPolygon.createComplexPolygon([scaledPolygon]);
							
							let singlePolygonObj = null;
							if (complexPolygonObj.polygons && complexPolygonObj.polygons.length > 0) {
								singlePolygonObj = complexPolygonObj.polygons[0];
							} else if (complexPolygonObj) {
								singlePolygonObj = complexPolygonObj;
							}
							
							if (!singlePolygonObj) {
								continue;
							}
							
							try {
								const outlinePrimitive = await eda.pcb_PrimitivePolyline.create(
									'',
									item.layer,
									singlePolygonObj,
									item.lineWidth,
									false
								);
								
								if (outlinePrimitive) {
									primitives.push(outlinePrimitive);
									outlineCount++;
								}
							} catch (createError) {
								// 忽略错误
							}
						}
					} else {
						const complexPolygonObj = await eda.pcb_MathPolygon.createComplexPolygon(scaledPolygons);
						
						const fillPrimitive = await eda.pcb_PrimitiveFill.create(
							item.layer,
							complexPolygonObj
						);
						
						if (fillPrimitive) {
							primitives.push(fillPrimitive);
							fillCount++;
						}
					}
				} else {
					const polygon = AppState.polygonData.complexPolygon[item.index];
				
					const scaleX = item.width / item.originalWidth;
					const scaleY = item.height / item.originalHeight;
					
					let scaledPolygon = polygon;
					if (Math.abs(scaleX - 1) > 0.001 || Math.abs(scaleY - 1) > 0.001) {
						scaledPolygon = GeometryUtils.scalePolygon(polygon, scaleX, scaleY);
					}
					
					if (item.lineWidth > 0) {
						const complexPolygonObj = await eda.pcb_MathPolygon.createComplexPolygon([scaledPolygon]);
						
						let singlePolygonObj = null;
						
						if (complexPolygonObj.polygons && complexPolygonObj.polygons.length > 0) {
							singlePolygonObj = complexPolygonObj.polygons[0];
						} else if (complexPolygonObj) {
							singlePolygonObj = complexPolygonObj;
						}
						
						if (!singlePolygonObj) {
							eda.sys_Message.showToastMessage('无法创建轮廓：无法获取多边形对象', 'error');
							continue;
						}
						
						try {
							const outlinePrimitive = await eda.pcb_PrimitivePolyline.create(
								'',
								item.layer,
								singlePolygonObj,
								item.lineWidth,
								false
							);
							
							if (outlinePrimitive) {
								primitives.push(outlinePrimitive);
								outlineCount++;
							}
						} catch (createError) {
							throw createError;
						}
					} else {
						const complexPolygonObj = await eda.pcb_MathPolygon.createComplexPolygon([scaledPolygon]);
						
						const fillPrimitive = await eda.pcb_PrimitiveFill.create(
							item.layer,
							complexPolygonObj
						);
						
						if (fillPrimitive) {
							primitives.push(fillPrimitive);
							fillCount++;
						}
					}
				}
			}
			
			if (primitives.length === 0) {
				eda.sys_Message.showToastMessage('未能创建任何图元', 'error');
				return;
			}
			
			let message = '成功创建 ';
			if (fillCount > 0) message += `${fillCount} 个填充`;
			if (fillCount > 0 && outlineCount > 0) message += '和';
			if (outlineCount > 0) message += `${outlineCount} 个轮廓`;
			message += '图元，位于坐标原点处';
			
			eda.sys_Message.showToastMessage(message, 'success');
			
			PolygonManager.clearSelection();
		} catch (err) {
			eda.sys_Message.showToastMessage('生成失败: ' + err, 'error');
		}
	}
};

window.GeneratorModule = GeneratorModule;
