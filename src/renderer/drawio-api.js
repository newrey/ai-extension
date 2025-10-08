// Draw.io API模块 - 基于MCP扩展机制的简化实现
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
            console.log('调用add_new_rectangle函数', options);
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
                console.log('矩形添加成功，ID:', vertex.id);
                return { success: true, id: vertex.id };
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
            console.log('调用delete_cell_by_id函数', options);
            const editor = ui.editor;
            const graph = editor.graph;

            // 通过ID获取单元格
            const cell_id = options && options.cell_id ? options.cell_id : null;
            const cell = graph.getModel().getCell(cell_id);

            if (!cell) {
                console.warn('未找到指定ID的单元格:', cell_id);
                return { success: false, error: '未找到指定ID的单元格' };
            }

            // 开始事务
            graph.getModel().beginUpdate();
            try {
                // 从图中移除单元格
                graph.removeCells([cell]);
                console.log('单元格删除成功');
                return { success: true };
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
            console.log('调用add_edge函数', options);
            const editor = ui.editor;
            const graph = editor.graph;
            const model = graph.getModel();

            // 获取源和目标单元格
            const source = model.getCell(options && options.source_id ? options.source_id : null);
            const target = model.getCell(options && options.target_id ? options.target_id : null);

            if (!source || !target) {
                console.warn('未找到源或目标单元格:', { source_id: options.source_id, target_id: options.target_id });
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
                console.log('连线添加成功，ID:', edge.id);
                return { success: true, id: edge.id };
            } catch (error) {
                console.error('添加连线失败:', error);
                return { success: false, error: error.message };
            } finally {
                // 结束事务
                model.endUpdate();
            }
        },

        // 添加特定形状的单元格
        add_cell_of_shape: function(ui, options) {
            console.log('调用add_cell_of_shape函数', options);
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
            const shape_entry = shape_library_stub[shape_name];

            if (!shape_entry) {
                console.warn('未找到指定形状:', shape_name);
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
                console.log('形状单元格添加成功，ID:', cell.id);
                return { success: true, id: cell.id };
            } catch (error) {
                console.error('添加形状单元格失败:', error);
                return { success: false, error: error.message };
            } finally {
                // 结束事务
                graph.getModel().endUpdate();
            }
        },

        // 获取形状分类
        get_shape_categories: function(ui) {
            console.log('调用get_shape_categories函数');
            const categories = Object.values(shape_library_stub).reduce(function(acc, cur) {
                acc.add(cur.category);
                return acc;
            }, new Set());
            const result = { success: true, categories: Array.from(categories) };
            console.log('获取形状分类结果:', result);
            return result;
        },

        // 获取分类中的形状
        get_shapes_in_category: function(ui, options) {
            console.log('调用get_shapes_in_category函数', options);
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
            const result = { success: true, shapes: shapes };
            console.log('获取分类形状结果:', result);
            return result;
        },

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
    const checkDrawioInterval = setInterval(() => {
        if (window.Draw) {
            clearInterval(checkDrawioInterval);
            console.log('Draw.io对象已加载，开始初始化插件');
            
            window.Draw.loadPlugin((ui) => {
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
    }, 100);
})();
