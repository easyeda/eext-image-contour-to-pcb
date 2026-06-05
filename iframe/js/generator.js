/**
 * 图元生成模块
 */

const GeneratorModule = {
	/**
	 * 生成填充图元
	 */
	async generateFill() {
		if (!AppState.polygonData) {
			eda.sys_Message.showToastMessage(t('SelectImageFirst'), 'warn');
			return;
		}

		if (AppState.selectedPolygons.length === 0) {
			eda.sys_Message.showToastMessage(t('SelectContoursToFill'), 'warn');
			return;
		}

		// 检查是否有板框层且线宽为0的情况
		const boardOutlineWithFill = AppState.selectedPolygons.find(item => item.layer === 11 && item.lineWidth === 0);
		if (boardOutlineWithFill) {
			eda.sys_Message.showToastMessage(t('BoardOutlineNoFill'), 'error');
			return;
		}

		// 检查是否有多层且线宽大于0的情况
		const multiLayerWithLine = AppState.selectedPolygons.find(item => item.layer === 12 && item.lineWidth > 0);
		if (multiLayerWithLine) {
			eda.sys_Message.showToastMessage(t('MultiLayerNoLine'), 'error');
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
							eda.sys_Message.showToastMessage(t('CannotCreateContour'), 'error');
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
				eda.sys_Message.showToastMessage(t('NoPrimitivesCreated'), 'error');
				return;
			}
			
			let message;
			if (fillCount > 0 && outlineCount > 0) {
				message = t('CreatedFillAndOutline', fillCount, outlineCount);
			} else if (fillCount > 0) {
				message = t('CreatedFillOnly', fillCount);
			} else {
				message = t('CreatedOutlineOnly', outlineCount);
			}

			eda.sys_Message.showToastMessage(message, 'success');
			
			PolygonManager.clearSelection();
		} catch (err) {
			eda.sys_Message.showToastMessage(t('GenerationFailed', err), 'error');
		}
	}
};

window.GeneratorModule = GeneratorModule;
