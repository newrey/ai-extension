// Draw.io API模块 - 基于MCP扩展机制的完整实现
(function() {
    // 形状库定义（从drawio_stub.ts复制）
    const shape_library_stub = {
        rectangle: { category: "general", style: "rounded=0;whiteSpace=wrap;html=1;" },
        rounded_rectangle: { category: "general", style: "rounded=1;whiteSpace=wrap;html=1;" },
        text: { category: "general", style: "text;html=1;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;" },
        ellipse: { category: "general", style: "ellipse;whiteSpace=wrap;html=1;" },
        square: { category: "general", style: "whiteSpace=wrap;html=1;aspect=fixed;" },
        circle: { category: "general", style: "ellipse;whiteSpace=wrap;html=1;aspect=fixed;" },
        process: { category: "general", style: "shape=process;whiteSpace=wrap;html=1;backgroundOutline=1;" },
        diamond: { category: "general", style: "rhombus;whiteSpace=wrap;html=1;" },
        triangle: { category: "general", style: "triangle;whiteSpace=wrap;html=1;" },
        cloud: { category: "general", style: "ellipse;shape=cloud;whiteSpace=wrap;html=1;" },
        document: { category: "general", style: "shape=document;whiteSpace=wrap;html=1;boundedLbl=1;" },
        note: { category: "general", style: "shape=note;whiteSpace=wrap;html=1;backgroundOutline=1;darkOpacity=0.05;" }
    };

    // 全局UI对象，通过loadPlugin设置
    window.drawioUI = null;

    // 创建全局drawioAPI对象
    window.drawioAPI = {
        // 添加矩形
        add_new_rectangle: function(ui, options) {
            const editor = ui.editor;
            const graph = editor.graph;

            // 默认值
            const x = options && options.x ? options.x : 100;
            const y = options && options.y ? options.y : 100;
            const width = options && options.width ? options.width : 120;
            const height = options && options.height ? options.height : 60;
            const text = options && options.text ? options.text : "";
            const style = options && options.style ? options.style : "whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#000000;";

            // 开始事务以支持撤销/重做
            graph.getModel().beginUpdate();
            try {
                // 创建矩形顶点
                const vertex = graph.insertVertex(
                    graph.getDefaultParent(), // parent
                    null, // ID (自动生成)
                    text, // value
                    x,
                    y, // position
                    width,
                    height, // size
                    style // style
                );
                // 返回可序列化的结果
                return {
                    success: true,
                    id: vertex.id,
                    x: x,
                    y: y,
                    width: width,
                    height: height,
                    text: text
                };
            } catch (error) {
                console.error('添加矩形失败:', error);
                return { success: false, error: error.message };
            } finally {
                // 结束事务
                graph.getModel().endUpdate();
            }
        },

        // 删除单元格
        delete_cell_by_id: function(ui, options) {
            const editor = ui.editor;
            const graph = editor.graph;

            // 通过ID获取单元格
            const cell_id = options && options.cell_id ? options.cell_id : null;
            const cell = graph.getModel().getCell(cell_id);

            if (!cell) {
                return { success: false, error: '未找到指定ID的单元格' };
            }

            // 开始事务
            graph.getModel().beginUpdate();
            try {
                // 从图中移除单元格
                graph.removeCells([cell]);
                return { success: true, id: cell_id };
            } catch (error) {
                console.error('删除单元格失败:', error);
                return { success: false, error: error.message };
            } finally {
                // 结束事务
                graph.getModel().endUpdate();
            }
        },

        // 添加连线
        add_edge: function(ui, options) {
            const editor = ui.editor;
            const graph = editor.graph;
            const model = graph.getModel();

            // 获取源和目标单元格
            const source = model.getCell(options && options.source_id ? options.source_id : null);
            const target = model.getCell(options && options.target_id ? options.target_id : null);

            if (!source || !target) {
                return { success: false, error: '未找到源或目标单元格' };
            }

            // 默认连线样式
            const defaultStyle = "endArrow=classic;html=1;rounded=0;";
            const style = options && options.style ? options.style : defaultStyle;
            const text = options && options.text ? options.text : "";

            // 开始事务
            model.beginUpdate();
            try {
                // 创建连线
                const edge = graph.insertEdge(
                    graph.getDefaultParent(), // parent
                    null, // ID (自动生成)
                    text, // value
                    source, // source
                    target, // target
                    style // style
                );
                // 返回可序列化的结果
                return {
                    success: true,
                    id: edge.id,
                    source_id: options.source_id,
                    target_id: options.target_id,
                    text: text
                };
            } catch (error) {
                console.error('添加连线失败:', error);
                return { success: false, error: error.message };
            } finally {
                // 结束事务
                model.endUpdate();
            }
        },

        // 获取形状分类
        get_shape_categories: function(ui) {
            const categories = Object.values(shape_library_stub).reduce(function(acc, cur) {
                acc.add(cur.category);
                return acc;
            }, new Set());
            return Array.from(categories);
        },

        // 获取分类中的形状
        get_shapes_in_category: function(ui, options) {
            const category_id = options && options.category_id ? options.category_id : null;
            const shapes = Object.entries(shape_library_stub)
                .filter(function(entry) {
                    var shape_key = entry[0];
                    var shape_value = entry[1];
                    return shape_value.category === category_id;
                })
                .map(function(entry) {
                    var shape_key = entry[0];
                    var shape_value = entry[1];
                    return {
                        id: shape_key,
                        title: shape_value.title || shape_key,
                    };
                });
            return shapes;
        },

        // 通过名称获取形状
        get_shape_by_name: function(ui, options) {
            const shape_name = options && options.shape_name ? options.shape_name : null;
            const shape = Object.entries(shape_library_stub).find(
                function(entry) {
                    var shape_key = entry[0];
                    var shape_value = entry[1];
                    return shape_key === shape_name;
                }
            );
            if (!shape) {
                return null;
            }
            return {
                id: shape[0],
                ...shape[1]
            };
        },

        // 添加特定形状的单元格
        add_cell_of_shape: function(ui, options) {
            const editor = ui.editor;
            const graph = editor.graph;

            // 默认值
            const shape_name = options && options.shape_name ? options.shape_name : "rectangle";
            const x = options && options.x ? options.x : 100;
            const y = options && options.y ? options.y : 100;
            const width = options && options.width ? options.width : 120;
            const height = options && options.height ? options.height : 80;
            const text = options && options.text ? options.text : "";
            const style = options && options.style ? options.style : "";

            // 查找形状
            const shape_entry = this.get_shape_by_name(ui, { shape_name: shape_name });

            if (!shape_entry) {
                return { success: false, error: '未找到指定形状: ' + shape_name };
            }

            // 开始事务
            graph.getModel().beginUpdate();
            try {
                // 使用找到的模板创建形状
                const cell = graph.insertVertex(
                    graph.getDefaultParent(),
                    null,
                    text,
                    x,
                    y,
                    width,
                    height,
                    shape_entry.style + ';' + style,
                    false
                );
                // 返回可序列化的结果
                return {
                    success: true,
                    id: cell.id,
                    shape_name: shape_name,
                    x: x,
                    y: y,
                    width: width,
                    height: height,
                    text: text
                };
            } catch (error) {
                console.error('添加形状单元格失败:', error);
                return { success: false, error: error.message };
            } finally {
                // 结束事务
                graph.getModel().endUpdate();
            }
        },

        // 移除循环依赖和函数
        remove_circular_dependencies: function(obj, visited, path) {
            if (visited === undefined) visited = new WeakSet();
            if (path === undefined) path = [];

            // 处理原始值（它们不能是循环的或函数）
            if (obj === null || typeof obj !== "object") {
                return obj;
            }

            // 处理数组
            if (Array.isArray(obj)) {
                if (visited.has(obj)) {
                    return '[Circular ' + path.join(".") + ']';
                }

                visited.add(obj);
                return obj.map(function(item, index) {
                    return this.remove_circular_dependencies(item, visited, path.concat('[' + index + ']'));
                }.bind(this));
            }

            // 处理Date、RegExp等 - 直接返回，因为它们不能包含循环引用或函数
            if (Object.prototype.toString.call(obj) !== "[object Object]") {
                return obj;
            }

            // 检查普通对象中的循环引用
            if (visited.has(obj)) {
                return '[Circular ' + path.join(".") + ']';
            }

            visited.add(obj);
            const result = {};

            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    const value = obj[key];
                    // 跳过函数
                    if (
                        typeof value !== "function" &&
                        key !== "children" &&
                        key !== "edges"
                    ) {
                        let stripped_value = {};
                        if (
                            (key === "parent" || key === "source" || key === "target") &&
                            value !== undefined &&
                            value !== null
                        ) {
                            stripped_value = {
                                id: value.id,
                            };
                        } else {
                            stripped_value = value;
                        }
                        result[key] = this.remove_circular_dependencies(stripped_value, visited, path.concat(key));
                    }
                }
            }

            return result;
        },

        // 将NamedNodeMap转换为属性对象
        transform_NamedNodeMap_to_attributes: function(cell) {
            // 将NamedNodeMap属性转换为标准对象
            var transformed_attributes = {};
            if (cell.value.attributes && typeof cell.value.attributes === "object") {
                var attributes = cell.value.attributes;
                if (attributes.length !== undefined) {
                    // 处理NamedNodeMap（有length属性）
                    for (var i = 0; i < attributes.length; i++) {
                        var attr = attributes[i];
                        if (attr && attr.name && attr.value !== undefined) {
                            transformed_attributes[attr.name] = attr.value;
                        }
                    }
                } else {
                    // 处理常规对象属性
                    transformed_attributes = attributes;
                }
            }

            return transformed_attributes;
        },

        // 转换单元格对象以保留必要字段并清理数据
        transform_cell_for_display: function(cell) {
            if (!cell || typeof cell !== "object") {
                return null;
            }

            const transformed = {
                id: cell.id || "",
                mxObjectId: cell.mxObjectId || "",
                value: "",
                geometry: cell.geometry,
                style: cell.style,
                edge: cell.edge,
                edges: cell.edges,
                parent: cell.parent,
                source: cell.source,
                target: cell.target,
            };

            // 处理value字段转换
            if (cell.value !== null && cell.value !== undefined) {
                if (typeof cell.value === "string") {
                    transformed.value = cell.value;
                } else if (typeof cell.value === "object") {
                    const transformed_attributes = this.transform_NamedNodeMap_to_attributes(cell);

                    transformed.value = {
                        attributes: transformed_attributes,
                        nodeName: cell.value.nodeName,
                        localName: cell.value.localName,
                        tagName: cell.value.tagName,
                    };
                }
            }

            return transformed;
        },

        // 获取给定单元格的图层信息
        get_cell_layer: function(graph, cell) {
            if (!cell || !graph) {
                return null;
            }

            try {
                const layer = graph.getLayerForCell(cell);
                if (layer) {
                    return {
                        id: layer.id || "",
                        name: layer.value || "Default Layer",
                    };
                }
            } catch (error) {
                // 处理getLayerForCell可能不可用的情况
                console.warn("Could not get layer for cell:", error);
            }

            return null;
        },

        // 检查是否为根单元格
        mx_isRoot: function(root_cell) {
            return function(cell) {
                return null != cell && cell == root_cell;
            };
        },

        // 检查是否为图层
        mx_isLayer: function(root_cell) {
            return function(cell) {
                return this.mx_isRoot(root_cell)(cell.getParent());
            }.bind(this);
        },

        // 列出图形中的分页模型数据，包含转换和清理
        list_paged_model: function(ui, options) {
            if (options === undefined) options = {};
            const editor = ui.editor;
            const graph = editor.graph;
            const model = graph.getModel();
            const cells = model.cells;

            if (!cells) {
                return [];
            }

            // 辅助函数：将样式字符串解析为键值对
            function parse_style_attributes(style) {
                const attributes = {};
                if (!style) return attributes;

                const pairs = style.split(";");
                for (const pair of pairs) {
                    const [key, ...valueParts] = pair.split("=");
                    if (key && valueParts.length > 0) {
                        attributes[key.trim()] = valueParts.join("=").trim();
                    }
                }
                return attributes;
            }

            // 辅助函数：从单元格值中提取属性
            var extract_cell_attributes = function(cell) {
                var attributes = {};

                // 添加基本单元格属性
                attributes.id = cell.id || "";
                attributes.edge = cell.edge || false;

                // 添加样式属性
                if (cell.style) {
                    Object.assign(attributes, parse_style_attributes(cell.style));
                }

                // 如果值是对象，则添加值属性
                if (cell.value && typeof cell.value === "object" && cell.value.attributes) {
                    var transformed_attributes = this.transform_NamedNodeMap_to_attributes(cell);
                    Object.assign(attributes, transformed_attributes);
                }

                // 将文本值添加为属性
                if (cell.value && typeof cell.value === "string") {
                    attributes.text = cell.value;
                }

                return attributes;
            }.bind(this);

            // 辅助函数：评估布尔逻辑表达式
            function evaluate_filter_expression(expression, attributes) {
                if (!Array.isArray(expression) || expression.length === 0) {
                    return true;
                }

                const [operator, ...operands] = expression;

                switch (operator) {
                    case "and":
                        return operands.every(function(op) {
                            return evaluate_filter_expression(op, attributes);
                        });

                    case "or":
                        return operands.some(function(op) {
                            return evaluate_filter_expression(op, attributes);
                        });

                    case "equal":
                        if (operands.length !== 2) return false;
                        const [key, value] = operands;
                        return attributes[key] === value;

                    default:
                        return true;
                }
            }

            // 辅助函数：检查单元格类型
            function matches_cell_type(cell, cell_type, isLayer) {
                switch (cell_type) {
                    case "edge":
                        return cell.edge === true || cell.edge === 1;
                    case "vertex":
                        return cell.edge === false;
                    case "object":
                        return cell.value && cell.value.nodeName === "object";
                    case "group":
                        return cell.style === "group";
                    case "layer":
                        return isLayer(cell);
                    default:
                        return true;
                }
            }

            // 应用过滤
            var filtered_cells = Object.values(cells);

            if (options.filter) {
                var self = this;
                filtered_cells = filtered_cells.filter(function(cell) {
                    // 检查单元格类型过滤器
                    if (
                        options.filter.cell_type &&
                        !matches_cell_type(
                            cell,
                            options.filter.cell_type,
                            self.mx_isLayer(model.root)
                        )
                    ) {
                        return false;
                    }

                    // 检查属性过滤器
                    if (options.filter.attributes && options.filter.attributes.length > 0) {
                        var cellAttributes = extract_cell_attributes(cell);
                        if (
                            !evaluate_filter_expression(options.filter.attributes, cellAttributes)
                        ) {
                            return false;
                        }
                    }

                    return true;
                });
            }

            // 默认分页值
            const page = Math.max(0, options.page || 0);
            const page_size = Math.max(1, options.page_size || 50);
            const start_index = page * page_size;

            // 获取过滤后的单元格ID并切片进行分页
            const cell_ids = filtered_cells.map(function(cell) { return cell.id; });
            const paginated_ids = cell_ids.slice(start_index, start_index + page_size);

            // 转换和清理每个单元格
            var transformed_cells = [];
            var self = this;

            for (var i = 0; i < paginated_ids.length; i++) {
                var cell_id = paginated_ids[i];
                var cell = cells[cell_id];
                if (cell) {
                    // 移除循环依赖并转换
                    var sanitized_cell = self.remove_circular_dependencies(cell);
                    var transformed_cell = self.transform_cell_for_display(sanitized_cell);

                    if (transformed_cell) {
                        var layer_info = self.get_cell_layer(graph, cell);
                        if (layer_info) {
                            transformed_cell.layer = layer_info;
                        }

                        var tags_info = self.get_cell_tags(graph, cell);
                        if (tags_info && tags_info.length > 0) {
                            transformed_cell.tags = tags_info;
                        }
                        transformed_cells.push(transformed_cell);
                    }
                }
            }

            return transformed_cells;
        },

        // 获取单元格标签
        get_cell_tags: function(graph, cell) {
            if (!cell || !graph) {
                return [];
            }

            try {
                const tags = graph.getTagsForCell(cell);
                return tags || [];
            } catch (error) {
                console.warn("Could not get tags for cell:", error);
                return [];
            }
        }
    };

    console.log('Draw.io API模块加载完成');

    // 监听来自主页面的命令请求
    window.addEventListener('message', (event) => {
        // 确保消息来自主页面
        if (event.source === window.parent && event.data.type === 'drawio_command') {
            const { command, parameters, requestId } = event.data;
            console.log('收到Draw.io命令:', command, parameters, requestId);
            
            // 使用全局UI对象执行命令
            if (window.drawioUI && window.drawioAPI[command]) {
                try {
                    const result = window.drawioAPI[command](window.drawioUI, parameters);
                    // 发送响应到主页面
                    window.parent.postMessage({
                        type: 'drawio_response',
                        requestId,
                        success: true,
                        result
                    }, '*');
                } catch (error) {
                    console.error('执行命令失败:', error);
                    window.parent.postMessage({
                        type: 'drawio_response',
                        requestId,
                        success: false,
                        error: error.message
                    }, '*');
                }
            } else {
                console.warn('UI对象未初始化或命令不存在:', command);
                window.parent.postMessage({
                    type: 'drawio_response',
                    requestId,
                    success: false,
                    error: 'UI对象未初始化或命令不存在'
                }, '*');
            }
        }
    });

    // 等待Draw.io加载完成后初始化UI对象
    (function() {
        var checkDrawioInterval = null;
        var isDrawioInitialized = false;

        function initializeDrawio() {
            if (isDrawioInitialized) {
                return;
            }
            
            if (window.Draw) {
                if (checkDrawioInterval) {
                    clearInterval(checkDrawioInterval);
                    checkDrawioInterval = null;
                }
                
                isDrawioInitialized = true;
                console.log('Draw.io对象已加载，开始初始化插件');
                
                window.Draw.loadPlugin(function(ui) {
                    window.drawioUI = ui;
                    console.log('Draw.io UI已通过loadPlugin初始化');
                    
                    // 发送API就绪消息
                    if (window.parent) {
                        window.parent.postMessage({ 
                            type: 'drawio_api_ready',
                            uiAvailable: true
                        }, '*');
                    }
                });
            } else {
                console.log('等待Draw.io对象加载...');
            }
        }

        // 立即检查一次
        initializeDrawio();
        
        // 如果没有初始化，则设置定时器
        if (!isDrawioInitialized) {
            checkDrawioInterval = setInterval(initializeDrawio, 1000);
        }
    })();
})();
