<template>

    <div class="canvas-container">

        <canvas
            ref="canvas"
            :width="this.canvasWidth"
            :height="this.canvasHeight"
            :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
            @mousemove="handleMouseMove"
            @mousedown="handleMouseDown"
            @mouseup="handleMouseUp"
            @mouseleave="handleMouseUp"
            @contextmenu="handleCanvasRightClick"
        />
        <div class="coordinate-display">
            坐标：({{ coordinate.x }}, {{ coordinate.y }})
        </div>
        <el-dialog
            title="输入距离"
            :visible.sync="showDistanceDialog"
            width="300px"
            @close="cancelDistanceInput"
        >
            <div>
                向 <strong>{{ directionMap[currentDirection] || currentDirection }}</strong>，
                请输入该方向上的距离：
                <el-input v-model="inputDistance" type="number" placeholder="输入距离"></el-input>
            </div>


            <template #footer>
                <el-button @click="cancelDistanceInput">取消</el-button>
                <el-button type="primary" @click="confirmDistanceInput">确定</el-button>
            </template>
        </el-dialog>
        <div
            v-if="showPointMenu"
            :style="contextMenuStyle"
            class="context-menu"
            @mouseleave="closeContextMenu"
        >
            <el-menu
                @select="handlePointMenuSelect"
                class="custom-menu"
            >
                <el-menu-item index="edit">
                    <i class="el-icon-edit"></i>
                    <span>编辑坐标</span>
                </el-menu-item>
                <el-menu-item index="delete">
                    <i class="el-icon-delete"></i>
                    <span>删除点</span>
                </el-menu-item>
                <el-menu-item index="setStart">
                    <i class="el-icon-place"></i>
                    <span>设为铺装起点</span>
                </el-menu-item>
            </el-menu>
        </div>

        <div
            v-if="showLineMenu"
            :style="contextMenuStyle"
            class="context-menu"
            @mouseleave="closeContextMenu"
        >
            <el-menu
                @select="handleLineMenuSelect"
                class="custom-menu"
            >
                <el-menu-item index="setEllipse">
                    <i class="el-icon-ellipse-check"></i>
                    <span>设为圆</span>
                </el-menu-item>
                <el-menu-item index="setLine">
                    <i class="el-icon-minus"></i>
                    <span>设为线</span>
                </el-menu-item>
                <el-menu-item index="setWall">
                    <i class="el-icon-house"></i>
                    <span>设为墙</span>
                </el-menu-item>
                <el-menu-item index="setDoor">
                    <i class="el-icon-unlock"></i>
                    <span>设为门</span>
                </el-menu-item>
            </el-menu>
        </div>
        <el-dialog
            title="编辑坐标"
            :visible.sync="showEditDialog"
            width="30%"
        >
            <el-form label-width="80px">
                <el-form-item label="X坐标">
                    <el-input-number
                        v-model="editingPoint.x"
                        :step="100"
                    />
                </el-form-item>
                <el-form-item label="Y坐标">
                    <el-input-number
                        v-model="editingPoint.y"
                        :step="100"
                    />
                </el-form-item>
            </el-form>
            <span slot="footer">
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmEdit">确定</el-button>
      </span>
        </el-dialog>
        <el-dialog
            title="设置曲线参数"
            :visible.sync="showCurveDialog"
            width="300px"
        >
            <div>
                <el-form label-width="80px">
                    <el-form-item label="轴长">
                        <el-input-number
                            v-model="curveAxisLength"
                            :min="0"
                            :step="100"
                        />
                    </el-form-item>
                </el-form>
            </div>
            <template #footer>
                <el-button @click="showCurveDialog = false">取消</el-button>
                <el-button type="primary" @click="confirmCurve">确定</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script>
import Point from '@/components/page/UserHouseManage/js/Point.js';

export default {
    name:'AnnotationCanvas',
    props: {
        points: {
            type: Array,
            default: () => []
        },
        rooms: {
            type: Array,
            default: () => []
        },
        selectedRoom: {
            type: Object,
            default: null
        },
        images: {
            type: Array,
            default: () => []
        },
        selectedImageIndex: {
            type: Number,
            default: 0
        },
        firstPoint: {
            type: Point,
            default: null
        },
        lastPoint: {
            type: Point,
            default: null
        },
        // 修正 prop 命名规范（可选）
        tempPoint: {
            type: Point,
            default: null
        },
        dragStatus: {
            type: Boolean,
            default: true
        },
        drawStatus: {
            type: Boolean,
            default: false
        },
    },
    watch: {
        tempPoint(newVal, oldVal) {
            if (newVal && newVal.someMethod) {
                // 调用函数之前确保它是有效的
                newVal.someMethod.apply(newVal, args);
            } else {
                console.warn('someMethod is not defined');
            }
        },

        lastPoint: {
            handler(newVal) {
                // 这里添加处理逻辑（如有需要）
            },
            deep: true,  // 若需要深度监听
            immediate: true  // 若需要立即执行
        },
        firstPoint(newVal, oldVal) {
            if (newVal && newVal.someMethod) {
                // 调用函数之前确保它是有效的
                newVal.someMethod.apply(newVal, args);
            } else {
                console.warn('someMethod is not defined');
            }
        },
        images: {
            handler(newImages) {
                this.loadedImages = [];
                newImages.forEach((imgObj, idx) => {
                    const img = new Image();
                    img.src = imgObj.base64;
                    img.onload = () => {
                        this.loadedImages[idx] = img;
                        this.redraw();
                    };
                });
            },
            deep: true,
            immediate: true
        },
        points: {
            handler(newVal) {
                this.localPoints = newVal.map(point => {
                    if (point instanceof Point) {
                        return point;
                    } else {
                        return new Point(point.x, point.y, point.visible);
                    }
                });
                this.autoFit();
            },
            immediate: true,
            deep: true
        },
        selectedRoom: {
            handler(newVal) {
                if (newVal) {
                    this.localPoints = newVal.room_data.map(p => new Point(p[0], p[1]));
                    this.autoFit();
                    this.redraw();
                }
            },
            deep: true
        },
        dragStatus(newVal) {
            if (!newVal) {
                this.isDragging = false; // 外部关闭时立即停止拖拽
                this.$refs.canvas.style.cursor = 'default';
            }
        },
        drawStatus(newVal) {
            if (!newVal) {
                this.isDragging = false; // 外部关闭时立即停止拖拽
                this.$refs.canvas.style.cursor = 'default';
            }
        }
    },
    data() {
        return {
            isDragging: false, // 是否正在拖动画布
            lastDragPos: { x: 0, y: 0 }, // 上一次拖动的鼠标位置
            ctx: null, // Canvas 的绘图上下文
            localPoints: [], // 当前绘制的点的集合
            coordinate: {x: 0, y: 0}, // 当前鼠标指针的逻辑坐标（已缩放+偏移后的真实坐标）
            currentPoint: {x: '', y: ''}, // 当前选中的点（用于某些输入操作）
            visiblePoints: [], // 当前画布中可见的点（可用于分页或渲染优化）
            scale: 1, // 当前缩放比例
            offset: {x: 0, y: 0}, // 画布的偏移量（用于拖动）
            minScale: 0.01, // 最小缩放比例
            maxScale: 5, // 最大缩放比例
            loadedImages: [], // 已加载的图像资源（用于背景图渲染等）
            selectedRoomId: -1, // 当前选中的房间 ID（可选功能）
            autoFitApplied: false, // 是否已自动适配过画布
            area: 0, // 当前图形的面积（可计算并展示）
            length: 0, // 当前图形的总长度（例如线段长度总和）
            canvasWidth: 1100, // canvas 宽度
            canvasHeight: 900, // canvas 高度
            currentMousePos: { x: 0, y: 0 }, // 当前鼠标在逻辑坐标系中的位置（用于绘图中动态展示）
            isMouseInCanvas: false, // 鼠标是否位于 canvas 内部
            showDistanceDialog: false, // 是否显示输入距离的弹窗
            currentDirection: '', // 当前绘图方向（上、下、左、右）
            currentBasePoint: null, // 当前绘图的起始点
            inputDistance: '', // 用户输入的距离（用于确定新点位置）

            // 新增数据项（右键菜单和编辑点）
            showContextMenu: false, // 是否显示右键菜单
            contextMenuStyle: {
                top: '0px',
                left: '0px'
            }, // 右键菜单的位置样式
            selectedPoint: null, // 当前被选中的点（右键点击选中）
            showEditDialog: false, // 是否显示编辑点弹窗
            editingPoint: {
                x: 0,
                y: 0,
                originalX: null, // 编辑前的原始 x 坐标
                originalY: null  // 编辑前的原始 y 坐标
            },

            directionMap: {
                right: '右',
                left: '左',
                up: '上',
                down: '下'
            }, // 英文方向与中文的映射（用于界面展示）
            selectedLine: null, // 新增选中线段
            showCurveDialog: false,
            curveAxisLength: 0,
            showPointMenu: false,
            showLineMenu: false,
        };
    },
    mounted() {
        const canvas = this.$refs.canvas;
        this.ctx = canvas.getContext('2d'); // 获取 canvas 的 2D 渲染上下文

        this.updateCanvasSize(); // 初始化画布尺寸
        window.addEventListener('resize', this.updateCanvasSize); // 监听窗口大小变化，自动调整画布大小

        this.scale = 1; // 初始化缩放比例
        this.offset = {x: 0, y: 0}; // 初始化偏移量（用于平移）

        // 添加滚轮缩放事件监听
        canvas.addEventListener('wheel', this.handleWheel, {passive: false});

        // 鼠标进入画布时标记状态并重绘
        canvas.addEventListener("mouseenter", () => {
            this.isMouseInCanvas = true;
            this.redraw();
        });

        // 鼠标离开画布时标记状态并重绘
        this.$refs.canvas.addEventListener('mousemove', this.handleMouseMove);
        this.$refs.canvas.addEventListener('mousedown', this.handleMouseDown);
        this.$refs.canvas.addEventListener('mouseup', this.handleMouseUp);
        canvas.addEventListener("mouseleave", () => {
            this.isMouseInCanvas = false;
            this.redraw();
        });

        this.redraw(); // 初始绘制画布内容
    },

    beforeDestroy() {
        window.removeEventListener('resize', this.updateCanvasSize); // 销毁时移除监听
    },

    methods: {
        updateCanvasSize() {
            const containerWidth = window.innerWidth * 0.59; // 设置 canvas 宽度为窗口的 58%
            const containerHeight = window.innerHeight * 0.84; // 设置高度为 82%
            this.canvasWidth = containerWidth;
            this.canvasHeight = containerHeight;
            this.redraw(); // 更新画布内容
        },

        // 修改 autoFit 方法中的偏移计算
        autoFit() {
            if (this.localPoints.length === 0) return;

            // 获取点集的边界坐标
            const minX = Math.min(...this.localPoints.map(p => p.x));
            const minY = Math.min(...this.localPoints.map(p => p.y));
            const maxX = Math.max(...this.localPoints.map(p => p.x));
            const maxY = Math.max(...this.localPoints.map(p => p.y));

            const width = maxX - minX;
            const height = maxY - minY;

            // 计算缩放因子，并设置为合适的比例
            const scaleX = (this.canvasWidth * 0.9) / width;
            const scaleY = (this.canvasHeight * 0.9) / height;
            this.scale = Math.min(scaleX, scaleY, this.maxScale);

            // 居中显示所有点
            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;

            this.offset = {
                x: this.canvasWidth / 2 - centerX * this.scale,
                y: this.canvasHeight / 2 - centerY * this.scale
            };

            this.autoFitApplied = true;
        },

        //用于数字格式化显示千分位分隔符，例如：1234567 → 1,234,567。
        formatNumberWithCommas(cellValue) {
            if (cellValue == null) return '';
            return cellValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        },


        handleMouseMove(e) {
            // 获取 canvas 在页面中的位置信息
            const rect = this.$refs.canvas.getBoundingClientRect();
            // ✨ 动态设置鼠标样式：正在拖拽 => grabbing；否则若处于拖拽状态 => grab
            if (this.isDragging) {
                this.$refs.canvas.style.cursor = 'grabbing';
            } else if (this.dragStatus) {
                this.$refs.canvas.style.cursor = 'grab';
            } else if (this.drawStatus) {
                this.$refs.canvas.style.cursor = 'crosshair';
            } else {
                this.$refs.canvas.style.cursor = 'default';
            }
            // 将鼠标位置从屏幕坐标转换为逻辑坐标（考虑缩放和平移）
            const x = (e.clientX - rect.left - this.offset.x) / this.scale;
            const y = (this.canvasHeight - (e.clientY - rect.top) - this.offset.y) / this.scale;

            // 如果当前处于绘制状态，则记录当前位置并触发重绘
            if(this.drawStatus) {
                this.currentMousePos = { x, y };
                this.redraw(); // 重新绘制图形
            }

            // 实时更新坐标显示（保留1位小数）
            this.coordinate.x = x.toFixed(1);
            this.coordinate.y = y.toFixed(1);

            // 如果正在拖拽视图
            if (this.isDragging) {
                // 当前鼠标位置
                const currentX = e.clientX - rect.left;
                const currentY = e.clientY - rect.top;

                // 根据鼠标移动的差值更新偏移量
                this.offset.x += currentX - this.lastDragPos.x;
                this.offset.y -= currentY - this.lastDragPos.y; // 注意：Y轴方向相反

                // 更新上一次拖拽的位置
                this.lastDragPos = { x: currentX, y: currentY };

                // 重绘图像以体现拖拽结果
                this.redraw();
            }
        },



        //鼠标的点击处理函数
        handleMouseDown(e) {
            const rect = this.$refs.canvas.getBoundingClientRect();
            const canvasX = e.clientX - rect.left;
            const canvasY = e.clientY - rect.top;

            // 转换为逻辑坐标
            const x = (canvasX - this.offset.x) / this.scale;
            const y = (this.canvasHeight - canvasY - this.offset.y) / this.scale;

            // 左键按下并且处于拖拽模式
            if (this.dragStatus && e.button === 0) {
                this.isDragging = true;
                this.lastDragPos = { x: canvasX, y: canvasY }; // 初始化拖拽起点
                this.$refs.canvas.style.cursor = 'grabbing';   // 改变鼠标样式

                // 左键按下并处于绘图状态
            } else if (this.drawStatus && e.button === 0) {
                const clickPoint = new Point(Math.round(x), Math.round(y)); // 点击点坐标四舍五入成整数

                if (this.localPoints.length > 0) {
                    const lastPoint = this.localPoints[this.localPoints.length - 1];

                    // 计算与上一个点的方向差
                    const dx = clickPoint.x - lastPoint.x;
                    const dy = lastPoint.y - clickPoint.y; // 注意 Y 轴反向

                    let direction = '';
                    if (Math.abs(dx) > Math.abs(dy)) {
                        direction = dx > 0 ? 'right' : 'left';
                    } else {
                        direction = dy > 0 ? 'down' : 'up';
                    }

                    // 设置当前绘图方向和起点
                    this.currentDirection = direction;
                    this.currentBasePoint = lastPoint;

                    // 弹出距离输入框
                    this.inputDistance = '';
                    this.showDistanceDialog = true;

                } else {
                    // 如果是第一个点，直接加入点集
                    this.localPoints.push(clickPoint);
                    this.$emit('update:points', this.localPoints); // 通知父组件更新点列表
                    this.redraw(); // 重绘图形
                }
            }
        },

        //鼠标的释放处理函数
        // handleMouseUp() {
        //     this.isDragging = false; // 停止拖拽
        //     this.$refs.canvas.style.cursor = 'crosshair'; // 恢复鼠标样式
        // },
        handleMouseUp(e) {
            if (this.isDragging) {
                this.isDragging = false;
                if (this.dragStatus) {
                    this.$refs.canvas.style.cursor = 'grab'; // 拖拽释放后变回 grab
                } else {
                    this.$refs.canvas.style.cursor = 'default';
                }
            }
        },

        // 修改后的滚轮缩放处理
        handleWheel(e) {
            e.preventDefault(); // 阻止页面滚动默认行为

            const oldScale = this.scale;
            const scaleFactor = 1.1;

            // 根据滚轮方向调整缩放比例（deltaY < 0 表示向上滚，放大）
            this.scale = e.deltaY < 0
                ? Math.min(this.maxScale, this.scale * scaleFactor)
                : Math.max(this.minScale, this.scale / scaleFactor);

            // 鼠标位置相对 canvas 的位置
            const rect = this.$refs.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            // 更新偏移量，保证缩放中心在鼠标位置
            this.offset.x = mx - (this.scale / oldScale) * (mx - this.offset.x);
            this.offset.y = this.canvasHeight - my - (this.scale / oldScale) *
                ((this.canvasHeight - my) - this.offset.y); // 注意 Y 轴反向处理

            this.redraw(); // 缩放后重新绘图
        },


        handleCanvasRightClick(e) {
            e.preventDefault();

            const rect = this.$refs.canvas.getBoundingClientRect();
            const logicalX = (e.clientX - rect.left - this.offset.x) / this.scale;
            const logicalY = (this.canvasHeight - (e.clientY - rect.top) - this.offset.y) / this.scale;

            const threshold = 5 / this.scale;

            // 检测线段
            this.selectedLine = this.getClosestLineSegment(logicalX, logicalY);

            // 检测点
            this.selectedPoint = this.localPoints.find(point =>
                Math.abs(point.x - logicalX) < threshold &&
                Math.abs(point.y - logicalY) < threshold
            );

            // 显示相应的菜单
            if (this.selectedLine) {
                this.showLineMenu = true;
                this.showPointMenu = false;
                this.contextMenuStyle = {
                    left: `${e.clientX}px`,
                    top: `${e.clientY}px`
                };
            }
            if (this.selectedPoint) {
                this.showPointMenu = true;
                this.showLineMenu = false;
                this.contextMenuStyle = {
                    left: `${e.clientX}px`,
                    top: `${e.clientY}px`
                };
            }
            if(!this.selectedPoint&&!this.selectedLine){
                this.closeContextMenu();
            }
        },
// 处理点菜单的选择
        handlePointMenuSelect(command) {
            switch(command) {
                case 'edit':
                    this.showEditDialog = true;
                    this.editingPoint = {
                        ...this.selectedPoint,
                        originalX: this.selectedPoint.x,
                        originalY: this.selectedPoint.y
                    };
                    break;
                case 'delete':
                    this.removePoint(this.selectedPoint);
                    break;
                case 'setStart':
                    this.setStartPoint();
                    break;

            }
            this.closeContextMenu();
        },


        handleLineMenuSelect(command) {
            switch(command) {
                case 'setEllipse':
                    this.showCurveDialog = true;
                    break;
                case 'setLine':
                    this.setCurveType('line');
                    break;
                case 'setDoor':
                    this.setCategory('door');
                    break;
                case 'setWall':
                    this.setCategory('wall');
                    break;
            }
            this.closeContextMenu();
        },
// 在getClosestLineSegment方法中返回点索引
//         getClosestLineSegment(logicalX, logicalY) {
//             const threshold = 8 / this.scale;
//             let closestLine = null;
//             let minDistance = Infinity;
//
//             for (let i = 0; i < this.localPoints.length; i++) {
//                 const p1 = this.localPoints[i];
//                 const p2 = this.localPoints[(i + 1) % this.localPoints.length];
//
//                 const distance = this.pointToLineDistance(
//                     {x: logicalX, y: logicalY},
//                     p1,
//                     p2
//                 );
//
//                 if (distance < threshold && distance < minDistance) {
//                     minDistance = distance;
//                     closestLine = {
//                         p1,
//                         p2,
//                         p1Index: i,          // 新增起点索引
//                         p2Index: (i + 1) % this.localPoints.length // 新增终点索引
//                     };
//                 }
//             }
//             return closestLine;
//         },
        getClosestLineSegment(x, y) {
            const threshold = 5 / this.scale;
            let closestLine = null;
            let minDistance = Infinity;
            for (let i = 0; i < this.visiblePoints.length; i++) {
                const p1 = this.visiblePoints[i];
                const p2 = this.visiblePoints[(i + 1) % this.visiblePoints.length];

                if (p1.curveType === 'ellipse') {
                    // 🔥 判断点击点是否在椭圆段附近
                    if (this.isPointOnEllipseSegment(x, y, p1, p2, threshold)) {
                        closestLine = {
                            p1,
                            p2,
                            p1Index: i,          // 新增起点索引
                            p2Index: (i + 1) % this.localPoints.length // 新增终点索引
                        };

                    }
                } else {
                    // 原有的点到线段距离逻辑
                    const distance = this.pointToLineDistance(
                        {x: x, y: y},
                        p1,
                        p2
                    );
                    if (distance < threshold && distance < minDistance) {
                        minDistance = distance;
                        closestLine = {
                            p1,
                            p2,
                            p1Index: i,          // 新增起点索引
                            p2Index: (i + 1) % this.localPoints.length // 新增终点索引
                        };
                    }

                }
            }
            if( closestLine){
            return closestLine;}
            return null;
        },
        isPointOnEllipseSegment(x, y, p1, p2, threshold) {
            const centerX = (p1.x + p2.x) / 2;
            const centerY = (p1.y + p2.y) / 2;

            const longAxis = this.calculateDistance(p1, p2) / 2;
            const shortAxis = p1.axisLength;
            const rotation = Math.atan2(p2.y - p1.y, p2.x - p1.x);

            // 坐标转换，把点旋转到椭圆坐标系
            const dx = x - centerX;
            const dy = y - centerY;

            const rotatedX = Math.cos(-rotation) * dx - Math.sin(-rotation) * dy;
            const rotatedY = Math.sin(-rotation) * dx + Math.cos(-rotation) * dy;

            // 判断点是否在椭圆弧附近
            const normalized = Math.pow(rotatedX / longAxis, 2) + Math.pow(rotatedY / shortAxis, 2);

            // 弧段是 Math.PI 到 0，所以只考虑上半弧
            if (rotatedX < -longAxis || rotatedX > longAxis) return false;
            if (rotatedY > 0) return false;

            return Math.abs(normalized - 1) < (threshold / longAxis); // 判断是否在椭圆边缘附近
        },


// 修改线段类型设置方法
        setCategory(type) {
            if (!this.selectedLine) return;

            const point = this.localPoints[this.selectedLine.p1Index];

            // 设置分类
            point.category = type;

            // 如果传入的 type 与当前曲线类型不同，才修改曲线类型
            if (type === 'wall') {
                if (point.curveType !== 'line') {
                    point.curveType = 'line';
                }
            } else {
                if (point.curveType !== 'dizzale') {
                    point.curveType = 'dizzale'; // 假设你故意用 dizzale 代替 ellipse
                }
            }

            // 触发响应式更新和重绘
            this.$emit('update:points', [...this.localPoints]);
            this.redraw();
        },

        setCurveType(type) {
            if (!this.selectedLine) return;

            // 直接修改原始点对象
            this.localPoints[this.selectedLine.p1Index].curveType = type;

            // 触发响应式更新
            this.$emit('update:points', [...this.localPoints]);
            this.redraw();
        },

// 修改确认曲线方法
        confirmCurve() {
            if (!this.selectedLine) {
                this.$message.error('请先选择一条线段！');
                return;
            }

            if (isNaN(this.curveAxisLength)) {
                this.$message.error('请输入有效的长度！');
                return;
            }

            // 直接修改原始点对象
            const p1 = this.localPoints[this.selectedLine.p1Index];

            p1.axisLength = this.curveAxisLength;
            p1.curveType = 'ellipse';

            // 触发响应式更新
            this.$emit('update:points', [...this.localPoints]);
            this.redraw();
            this.showCurveDialog = false;
        },

        confirmDistanceInput() {
            const distance = parseFloat(this.inputDistance); // 将用户输入的距离转换为浮点数
            if (isNaN(distance)) { // 如果输入不是数字
                this.$message.error('请输入有效的数字');
                return;
            }

            let newPoint;
            const base = this.currentBasePoint; // 当前起始点
            // 根据当前方向生成新点
            switch (this.currentDirection) {
                case 'up':
                    newPoint = new Point(base.x, base.y + distance);
                    break;
                case 'down':
                    newPoint = new Point(base.x, base.y - distance);
                    break;
                case 'left':
                    newPoint = new Point(base.x - distance, base.y);
                    break;
                case 'right':
                    newPoint = new Point(base.x + distance, base.y);
                    break;
            }

            // 检测是否与已有点重叠
            if(this.checkAutoOverlap(newPoint)){
                this.$message.warning('该点已存在，请输入其他距离');
                return; // ❗停止添加，弹窗不关闭
            }

            this.localPoints.push(newPoint); // 添加点
            this.$emit('update:points', this.localPoints); // 通知父组件数据更新
            this.redraw(); // 重绘画布
            this.showDistanceDialog = false; // 关闭输入框
        },





        // 设为起始点
        setStartPoint() {
            if (!this.selectedPoint) return;

            const currentIndex = this.localPoints.indexOf(this.selectedPoint);
            if (currentIndex <= 0) return; // 若已是起点或找不到，退出

            // 重新组织点顺序：[选中点, 后面的点, 前面的点]
            this.localPoints = [
                ...this.localPoints.slice(currentIndex),
                ...this.localPoints.slice(0, currentIndex)
            ];

            this.$emit('update:points', this.localPoints); // 通知父组件
            this.redraw(); // 重绘画布
        },


        // 确认编辑
        confirmEdit() {
            const { x, y, originalX, originalY } = this.editingPoint;

            // ✅ 非空 & 数字 校验
            if (
                this.editingPoint == null ||
                x === '' || y === '' ||
                x == null || y == null ||
                isNaN(x) || isNaN(y)
            ) {
                this.$message.error('请输入有效的 X/Y 坐标！');
                return;
            }

            // ✅ 冲突检测：排除自己（原始坐标的点）
            const hasConflict = this.localPoints.some(p =>
                !(p.x === originalX && p.y === originalY) &&
                this.calculateDistance(p, { x, y }) < 5
            );

            if (hasConflict) {
                this.$message.error('编辑失败：与其他点冲突！');
                return;
            }

            // ✅ 找到原始点并更新
            const targetPoint = this.localPoints.find(p => p.x === originalX && p.y === originalY);

            if (targetPoint) {
                Object.assign(targetPoint, { x, y });
                this.$emit('update:points', this.localPoints);
                this.redraw();
                this.showEditDialog = false;
                this.$message.success('编辑成功！');
            } else {
                this.$message.warning('未找到对应点位，可能已被删除');
            }
        },



        // 取消距离输入弹窗
        cancelDistanceInput() {
            this.showDistanceDialog = false;
        },

        //删除某个点
        removePoint(point) {
            const index = this.localPoints.indexOf(point);  //找到索引
            if (index > -1) {
                this.localPoints.splice(index, 1);
                this.$emit('update:points', this.localPoints);
                this.redraw();
            }
        },
        // 关闭菜单
        closeContextMenu() {
            this.showPointMenu = false;
            this.showLineMenu = false;
        },
        checkAutoOverlap(clickPoint) {
            if (!clickPoint) return false;

            // 点重叠判断逻辑，允许5像素容差范围（考虑缩放误差）
            const pointConflict = this.localPoints.some(point =>
                this.calculateDistance(point, clickPoint) < 5
            );

            return pointConflict;
        },
// 重新绘制整个画布
        redraw() {
            requestAnimationFrame(() => {
                // 先保存当前状态并重置变换矩阵
                this.ctx.save();
                this.ctx.setTransform(1, 0, 0, 1, 0, 0);
                this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight); // 清除整个画布
                this.ctx.restore();

                this.ctx.save();
                // 设置坐标变换：缩放+Y轴翻转+平移到offset
                this.ctx.setTransform(
                    this.scale,
                    0,
                    0,
                    -this.scale, // Y轴翻转
                    this.offset.x,
                    this.canvasHeight - this.offset.y // 平移原点到底部
                );
                // 绘制点与其他图形
                this.drawPoints();
                this.ctx.restore();
            });
        },

// 主绘制函数，绘制多边形、距离、标签等
        drawPoints() {
            if (this.localPoints.length === 0) return;

            this.handleScaleSettings(); // 自动调整缩放
            this.calculateMetrics(); // 计算面积、长度等信息

            this.drawPolygon(); // 绘制封闭多边形
            this.drawDistanceLabels(); // 绘制边长标签
            this.drawPointsWithLabels(); // 绘制点及其编号
            this.drawInteractiveElements(); // 绘制交互（临时点/虚线等）
        },

// 如果只有一个点时设置默认缩放比例
        handleScaleSettings() {
            if (this.localPoints.length === 1) {
                this.scale = 10;
            }
        },

// 计算可见点的总长度和面积/过滤掉不可见点进行绘制操作
        calculateMetrics() {
            this.length = this.calculatePolygonLength(this.localPoints); // 多边形周长
            this.area = this.calculatePolygonArea(this.localPoints);     // 多边形面积
            this.visiblePoints = this.localPoints.filter(p => p.visible !== false); // 过滤掉不可见点
        },

// 绘制多边形闭合路径
        drawPolygon() {
            this.ctx.beginPath();

            this.visiblePoints.forEach((point, index) => {
                const nextPoint = this.visiblePoints[(index + 1) % this.visiblePoints.length];

                if (index === 0) {
                    this.ctx.moveTo(point.x, point.y);
                }

                if (point.curveType === 'ellipse') {
                    this.drawEllipseSegment(point, nextPoint);
                } else if (point.category === 'door'&&point.curveType=== 'dizzale') {
                    this.drawZigzagLine(point, nextPoint);
                } else {
                    this.ctx.lineTo(nextPoint.x, nextPoint.y);
                }
            });

            this.ctx.closePath();

            this.ctx.fillStyle = 'rgba(255, 209, 127, 0.5)';
            this.ctx.fill();
            this.ctx.strokeStyle = 'blue';
            this.ctx.lineWidth = 1 / this.scale;
            this.ctx.stroke();
        },


        drawZigzagLine(p1, p2) {
            const zigzagCount = 10; // 锯齿数量
            const amplitude = 5 / this.scale; // 锯齿振幅，单位随缩放变化

            const dx = (p2.x - p1.x) / zigzagCount;
            const dy = (p2.y - p1.y) / zigzagCount;

            for (let i = 0; i <= zigzagCount; i++) {
                const x = p1.x + dx * i;
                const y = p1.y + dy * i;

                const offsetX = -dy;
                const offsetY = dx;
                const length = Math.sqrt(offsetX * offsetX + offsetY * offsetY);

                const normX = offsetX / length;
                const normY = offsetY / length;

                const offset = (i % 2 === 0 ? 1 : -1) * amplitude;

                const zx = x + normX * offset;
                const zy = y + normY * offset;

                this.ctx.lineTo(zx, zy);
            }
        },



// 为每条边添加中间的距离标签
        drawDistanceLabels() {
            if (this.visiblePoints.length <= 1) return;

            this.ctx.fillStyle = '#00ff00'; // 标签文字颜色
            this.ctx.textAlign = 'center';

            this.visiblePoints.forEach((point, index) => {
                const nextPoint = this.visiblePoints[(index + 1) % this.visiblePoints.length];
                if (nextPoint.visible === false) return;

                const midX = (point.x + nextPoint.x) / 2;
                const midY = (point.y + nextPoint.y) / 2;

                this.ctx.save();
                this.drawTextAtPhysicalPos(
                    Math.round(this.calculateDistance(point, nextPoint)), // 距离取整
                    midX,
                    midY,
                    this.getFontSize(100 * this.scale)
                );
                this.ctx.restore();
            });
        },

// 绘制每个点及其标签
        drawPointsWithLabels() {
            this.localPoints.forEach((point, index) => {
                if (point.visible === false) return;

                this.ctx.beginPath();
                point.draw(this.ctx, this.scale); // 自定义绘制点的方法

                this.ctx.save();
                this.ctx.fillStyle = 'rgba(30,144,255)'; // 标签颜色
                this.drawTextAtPhysicalPos(
                    `${index + 1}`, // 标签为点的编号
                    point.x,
                    point.y - 5 / this.scale, // 向上偏移
                    this.getFontSize(100 * this.scale),
                    'left'
                );
                this.ctx.restore();
            });
        },

// 绘制临时交互相关元素
        drawInteractiveElements() {
            if (this.drawStatus && this.visiblePoints.length > 0 && this.isMouseInCanvas) {
                this.drawDottedLine(); // 当前鼠标位置与最后一个点之间的虚线
            }

            if (!this.$parent.autoAddMode && this.tempPoint) {
                this.drawTempPoint(); // 临时预览点
            }
        },

// 在真实物理坐标下绘制文本
        drawTextAtPhysicalPos(text, logicalX, logicalY, fontSize, align = 'center') {
            this.ctx.setTransform(1, 0, 0, 1, 0, 0); // 恢复物理坐标
            const physicalPos = this.logicalToPhysical(logicalX, logicalY);
            this.ctx.font = `${fontSize}px Arial`;
            this.ctx.textAlign = align;
            this.ctx.fillText(text, physicalPos.x, physicalPos.y);
        },

// 根据缩放比例获取合适字体大小
        getFontSize(scaleFactor) {
            const sizeMap = [
                [300, 50],
                [200, 20],
                [100, 10],
                [60, 4]
            ];
            const matchedSize = sizeMap.find(([threshold]) => scaleFactor > threshold);
            return matchedSize ? matchedSize[1] : 80 * this.scale;
        },

// 鼠标位置与最后点之间画虚线
        drawDottedLine() {
            const lastPoint = this.visiblePoints[this.visiblePoints.length - 1];
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.moveTo(lastPoint.x, lastPoint.y);
            this.ctx.lineTo(this.currentMousePos.x, this.currentMousePos.y);

            const dx = this.currentMousePos.x - lastPoint.x;
            const dy = this.currentMousePos.y - lastPoint.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const dashLength = distance / 20; // 虚线间距

            this.ctx.setLineDash([dashLength, dashLength]);
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 1 / this.scale;
            this.ctx.stroke();
            this.ctx.restore();
        },

// 绘制预览临时点和与其连接的虚线
        drawTempPoint() {
            if (!this.tempPoint) return;

            this.ctx.beginPath();
            this.tempPoint.draw(this.ctx, this.scale);
            this.ctx.fillStyle = 'rgba(255,0,0,0.5)';
            this.ctx.fill();

            const lineWidth = 1 / Math.abs(this.ctx.getTransform().a);
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = lineWidth;

            const computeDash = (p1, p2) => {
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                return Math.sqrt(dx * dx + dy * dy) / 20;
            };

            if (this.firstPoint) {
                const dashLength = computeDash(this.firstPoint, this.tempPoint);
                this.ctx.setLineDash([dashLength, dashLength]);
                this.ctx.beginPath();
                this.ctx.moveTo(this.firstPoint.x, this.firstPoint.y);
                this.ctx.lineTo(this.tempPoint.x, this.tempPoint.y);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }

            if (this.lastPoint) {
                const dashLength = computeDash(this.lastPoint, this.tempPoint);
                this.ctx.setLineDash([dashLength, dashLength]);
                this.ctx.beginPath();
                this.ctx.moveTo(this.lastPoint.x, this.lastPoint.y);
                this.ctx.lineTo(this.tempPoint.x, this.tempPoint.y);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }
        },

// 两点之间距离
        calculateDistance(p1, p2) {
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            return Math.sqrt(dx * dx + dy * dy);
        },

// 逻辑坐标转换为屏幕物理坐标
        logicalToPhysical(logicalX, logicalY) {
            return {
                x: logicalX * this.scale + this.offset.x,
                y: this.canvasHeight - (logicalY * this.scale + this.offset.y)
            };
        },

// 计算多边形面积（Shoelace公式）
        calculatePolygonArea(points) {
            if (points.length < 3) return 0;
            let area = 0;
            for (let i = 0; i < points.length; i++) {
                const j = (i + 1) % points.length;
                area += points[i].x * points[j].y;
                area -= points[j].x * points[i].y;
            }
            return Math.abs(area / 2);
        },

// 计算多边形边长总和
        calculatePolygonLength(points) {
            if (points.length < 2) return 0;
            let length = 0;
            for (let i = 0; i < points.length; i++) {
                const j = (i + 1) % points.length;
                const dx = points[j].x - points[i].x;
                const dy = points[j].y - points[i].y;
                length += Math.sqrt(dx * dx + dy * dy);
            }
            return length;
        },



        pointToLineDistance(point, lineP1, lineP2) {
            const A = point.x - lineP1.x;
            const B = point.y - lineP1.y;
            const C = lineP2.x - lineP1.x;
            const D = lineP2.y - lineP1.y;

            const dot = A * C + B * D;
            const lenSq = C * C + D * D;
            let param = -1;

            if (lenSq !== 0) param = dot / lenSq;

            let xx, yy;
            if (param < 0) {
                xx = lineP1.x;
                yy = lineP1.y;
            } else if (param > 1) {
                xx = lineP2.x;
                yy = lineP2.y;
            } else {
                xx = lineP1.x + param * C;
                yy = lineP1.y + param * D;
            }

            const dx = point.x - xx;
            const dy = point.y - yy;
            return Math.sqrt(dx * dx + dy * dy);
        },
// 修改drawEllipseSegment方法
        drawEllipseSegment(p1, p2) {
            if (!p1.axisLength || p1.axisLength <= 0) return;

            const center = {
                x: (p1.x + p2.x) / 2,
                y: (p1.y + p2.y) / 2
            };

            const longAxis = this.calculateDistance(p1, p2) / 2;
            const shortAxis = p1.axisLength;
            const rotation = Math.atan2(p2.y - p1.y, p2.x - p1.x);

            // 🔥 直接把椭圆写入主路径，不 stroke，不 beginPath
            this.ctx.ellipse(
                center.x,
                center.y,
                longAxis,
                shortAxis,
                rotation,
                Math.PI,
                0,
                false
            );
        },


// 新增线段样式获取方法
        getSegmentStyle(point) {
            return {
                wall: '#409EFF',  // 墙体蓝色
                door: '#67C23A',  // 门洞绿色
                curve: '#E6A23C'  // 曲线橙色
            }[point.category] || '#909399';
        },

    }
};
</script>

<style scoped>

.canvas-container {
    position: static;
    top: 0;
    left: 4vw;
    width: 62vw; /* 或 calc(100% * 17 / 24) */
    height: 100vh;
    z-index: 1;
}


canvas {
    border: 2px solid #9c8c8e;
    border-radius: 8px;
    background-color: #ffffff;
    cursor: crosshair;
}
.context-menu {
    position: fixed;
    z-index: 9999;
    background: white;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
}

.custom-menu {
    border-right: none;
}

.custom-menu .el-menu-item {
    height: 36px;
    line-height: 36px;
    font-size: 13px;
}

.custom-menu .el-menu-item i {
    margin-right: 8px;
}
.coordinate-display {
    position: absolute;
    top: 20px;
    right: 600px;
    background-color: #409EFF;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 14px;
    color: #ffffff;
    pointer-events: none;
}


.zoom-info {
    position: absolute;
    bottom: 40px;
    right: 10px;
    background-color: white;
    padding: 5px;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.reset-btn,
.save-btn {
    padding: 8px 16px;
    background-color: #409eff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
    margin: 10px 0;
}

.reset-btn:hover,
.save-btn:hover {
    background-color: #3265b1;
}

.room-info-overlay {
    position: absolute;
    top: 10px;
    left: 10px;
    background-color: rgba(255, 255, 255, 0.8);
    padding: 10px;
    border-radius: 5px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
canvas {
    cursor: crosshair;
}

</style>
