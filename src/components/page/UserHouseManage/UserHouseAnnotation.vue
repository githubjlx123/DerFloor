<template>
    <div class="container">


        <div class="sidebar-left">
            <div class="toolFeatures1">

                <div class="tool-icon" @click="handleSave">
                    <i class="el-icon-document"></i>
                    <span class="tool-label">保存</span>
                </div>
                <div class="tool-icon" @click="handleReset">
                    <i class="el-icon-refresh"></i>
                    <span class="tool-label">重置</span>
                </div>
<!--                <div class="tool-icon" @click="handleUndo">-->
<!--                    <i class="el-icon-back"></i>-->
<!--                    <span class="tool-label">撤回</span>-->
<!--                </div>-->
                <!-- 分隔线 -->
                <div class="tool-divider"></div>
                <div class="tool-icon" :class="{ focus: isFocus === 'toolDrag' }" @click="handelToolDrag('toolDrag')">
                    <i class="el-icon-rank"></i>
                    <span class="tool-label">拖拽</span>
                </div>
                <div class="tool-icon" :class="{ focus: isFocus === 'toolPoint' }" @click="handleDrawPoint('toolPoint')">
                    <i class="el-icon-location-outline"></i>
                    <span class="tool-label">画点</span>
                </div>
            </div>
            </div>

        <!-- 左侧 Canvas区域 -->
        <div class="main-content">

            <AnnotationCanvas
                ref="drawingCanvas"
                :temp-point="tempPoint"
                :last-point="lastPoint"
                :first-point="firstPoint"
                :images="images"
                :selectedImageIndex="selectedImageIndex"
                :points="selectedRoomData"
                :rooms="rooms"
                :drag-status="dragStatus"
                :draw-status="drawStatus"
                :selectedRoom="selectedRoom"
                @update:points="val => selectedRoomData = val"
                @room-selected="handleRoomSelected"
            />
        </div>

        <div class="sidebar-right">
            <div class="commentResult">
                <el-card class="room-selection">
                    <template #header>
                        <div class="card-header">
                            <span>选择房间</span>
                            <el-tag :type="selectedRoom.is_label ? 'success' : 'danger'">
                                {{ selectedRoom.is_label ? '已标注' : '未标注' }}
                            </el-tag>

                        </div>
                    </template>

                    <el-select
                        v-model="selectedRoomId"
                        placeholder="请选择房间"
                        @change="selectRoom"
                        style="width: 100%"
                    >
                        <el-option
                            v-for="room in rooms"
                            :key="room.id"
                            :label="room.name"
                            :value="room.id"
                        />
                    </el-select>

                    <!-- 房间信息显示 -->
                    <div class="room-info" v-if="selectedRoom" style="margin-top: 5px;">
                        <!-- 描述列表展示面积和周长，水平排列 -->
                        <el-descriptions :column="3" size="small" class="custom-descriptions">
                            <el-descriptions-item label="面积">
                                <span class="desc-value">{{ formatNumberWithCommas(calculatePolygonArea(selectedRoomData)) }} m²</span>
                            </el-descriptions-item>
                            <el-descriptions-item label="周长">
                                <span class="desc-value">{{ formatNumberWithCommas(calculatePolygonLength(selectedRoomData)) }} m</span>
                            </el-descriptions-item>
                            <el-descriptions-item label="坐标点数量">
                            <span class="desc-value"> {{ selectedRoomData.length }}</span>
                            </el-descriptions-item>
                        </el-descriptions>


                    </div>
                </el-card>




                <!-- 使用el-tabs来替代原来的切换按钮 -->
                <el-tabs v-model="currentMode" type="border-card" @tab-change="handleTabChange"
                         class="custom-tabs"  >
                    <!-- 移动控制功能 -->
                    <el-tab-pane label="绘制模式" name="move">
                        <el-form :model="moveDistance">
                            <el-form-item label="自动保存" class="combined-control">
                                <div class="control-wrapper">
                                    <el-switch
                                        v-model="autoAddMode"
                                        :active-value="true"
                                        :inactive-value="false"
                                        style="--el-switch-on-color: #67C23A; --el-switch-off-color: #909399"
                                        @change="handleModeChange"

                                    >
                                        <template #active>
                                            <span class="inner-label">自动</span>
                                        </template>
                                        <template #inactive>
                                            <span class="inner-label">手动</span>
                                        </template>
                                    </el-switch>

                                    <!-- 坐标显示区域 -->
                                    <div v-if="tempPoint || show_lastPoint" class="coordinate-display1">
                                        <el-tag  class="coordinate-item">
                                            X: {{ autoAddMode ? show_lastPoint.x : tempPoint.x }}
                                        </el-tag>
                                        <el-tag class="coordinate-item">
                                            Y: {{ autoAddMode ? show_lastPoint.y : tempPoint.y }}
                                        </el-tag>
                                    </div>
                                </div>
                            </el-form-item>


                            <el-form-item label="平移距离">
                                <el-input-number
                                    v-model.number="moveDistance.value"
                                    :step="100"
                                    controls-position="right"
                                    style="width: 50%"
                                />
                            </el-form-item>

                            <el-form-item class="direction-buttons">
                                <div class="direction" >
                                    <div class="direction-container">
                                        <!-- 上下左右方向键 -->
                                        <div class="direction-keyboard">
                                            <div class="direction-row">
                                                <el-button
                                                    type="primary"
                                                    icon="el-icon-top"
                                                    @click="movePoint('up')"
                                                >上
                                                </el-button>
                                            </div>
                                            <div class="direction-row">
                                                <el-button
                                                    type="primary"
                                                    icon="el-icon-back"
                                                    @click="movePoint('left')"
                                                >左
                                                </el-button>
                                                <el-button
                                                    type="primary"
                                                    icon="el-icon-right"
                                                    @click="movePoint('right')"
                                                >右
                                                </el-button>
                                            </div>
                                            <div class="direction-row">
                                                <el-button
                                                    type="primary"
                                                    icon="el-icon-bottom"
                                                    @click="movePoint('down')"
                                                >下
                                                </el-button>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- 确认和取消按钮 -->


                                    <el-button
                                        v-if="!autoAddMode"
                                        type="success"
                                        :icon="isOverlapping ? 'el-icon-warning' : 'el-icon-check'"
                                        :disabled="isOverlapping || !tempPoint"
                                        @click="handleConfirmAction"
                                        class="add-btn"
                                    >
                                        {{ getConfirmButtonText }}
                                    </el-button>

                                    <el-button
                                        v-if="!autoAddMode"
                                        type="danger"
                                        icon="el-icon-close"
                                        :disabled="!tempPoint"
                                        @click="quitTempPoint"
                                        class="cancel-btn"
                                    >
                                        取消添加
                                    </el-button>
                                </div>

                            </el-form-item>

                        </el-form>
                    </el-tab-pane>
                    <!-- 插入点功能 -->
                    <el-tab-pane label="坐标模式" name="insert">
                        <el-form
                            :model="insertData"
                            label-width="90px"
                            class="form-align"
                        >
                            <!-- 前置索引输入 -->
                            <el-form-item label="前置索引">
                                <el-input-number
                                    v-model.number="insertData.startIndex"
                                    :min="0"
                                    :max="selectedRoomData.length || 1"
                                    :disabled="selectedRoomData.length === 0"
                                    controls-position="right"
                                    class="form-input"
                                />
                            </el-form-item>

                            <!-- 坐标输入组 -->
                            <div class="coordinate-group">
                                <el-form-item label="X坐标">
                                    <el-input-number
                                        v-model.number="insertData.newPoint.x"
                                        :step="100"
                                        class="form-input"
                                    />
                                </el-form-item>
                            </div>
                            <div class="coordinate-group">
                                <el-form-item label="Y坐标">
                                    <el-input-number
                                        v-model.number="insertData.newPoint.y"
                                        :step="100"
                                        class="form-input"
                                    />
                                </el-form-item>
                            </div>

                            <!-- 操作按钮 -->
                            <el-form-item class="form-action">
                                <el-button
                                    type="success"
                                    @click="insertPointAfter"
                                    icon="el-icon-insert"
                                    size="medium"
                                >插入点</el-button>
                            </el-form-item>
                        </el-form>
                    </el-tab-pane>
                </el-tabs>

                <el-card class="resultArea1">
                    <el-table
                        :data="selectedRoomData"
                        border
                        height="300px"
                        style="width: 100%"
                    >
                        <el-table-column label="序号" align="center">
                            <template #default="{ $index }">
                                {{ $index + 1 }}
                            </template>
                        </el-table-column>

                        <el-table-column prop="x" label="X坐标" align="center" />
                        <el-table-column prop="y" label="Y坐标" align="center" />

                        <el-table-column label="显隐" align="center">
                            <template #default="{ row, $index }">
                                <el-switch
                                    v-model="row.visible"
                                    active-color="#13ce66"
                                    inactive-color="#ff4949"
                                    @change="() => handleVisibilityChange($index)"
                                />
                            </template>
                        </el-table-column>

                        <el-table-column label="编辑" width="60" align="center">
                            <template #default="{ $index }">
                                <el-button
                                    type="primary"
                                    icon="el-icon-edit"
                                    size="mini"
                                    circle
                                    @click="editPoint($index)"
                                />
                            </template>
                        </el-table-column>

                        <el-table-column label="删除" width="65" align="center">
                            <template #default="{ $index }">
                                <el-button
                                    type="danger"
                                    icon="el-icon-delete"
                                    size="mini"
                                    circle
                                    @click="removePoint($index)"
                                />
                            </template>
                        </el-table-column>
                    </el-table>
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

                </el-card>





            </div>
        </div>
        <!-- 右侧 标注结果集 -->


    </div>
</template>

<script>
import Point from '@/components/page/UserHouseManage/js/Point.js';
import axios from 'axios';
import AnnotationCanvas from '@components/page/UserHouseManage/AnnotationCanvas.vue';
import { updateRoomLabelById } from '@/api/AnnotationManage';

import { getAnnotationHouseById } from '@/api/HouseManage';


// 修改后的保存方法

export default {
    name: 'datasetAnnotation',
    components: {
        AnnotationCanvas
    },
    data() {
        return {
            user_id: localStorage.getItem('ms_user_id'), // 从 localStorage 获取当前用户 ID，用于记录和标识当前操作人
            house_id: localStorage.getItem('annotation_house_id'), // 从 localStorage 获取当前标注的房间 ID，用于在多个房间之间切换标注数据
            insertData: {
                startIndex: 0, // 当前插入点的起始索引，用于决定将新点插入到哪个位置
                newPoint: { x: null, y: null } // 要插入的新点坐标，默认为 null，待用户点击或输入后赋值
            },
            currentMode: 'move', // 当前的操作模式，默认是“move”即平移模式，也可能是“draw”
            images: [
                {
                    name: '默认图片', // 图片名称
                    base64: require('@/assets/img/img.jpg') // 使用 require 加载本地图片资源（base64 形式），后续可扩展多张
                }
            ],
            isFocus: 'toolDrag', // 当前聚焦的工具栏按钮标识，默认是工具拖拽按钮（toolDrag）
            selectedImageIndex: 0, // 当前选择的图片索引，默认选择第 0 张图片
            rooms: [], // 房间列表，初始为空，后续通过 fetchRoomData 动态加载
            selectedRoom: null, // 当前选中的房间对象，初始为 null
            selectedRoomId: -1, // 当前选中房间的 ID，-1 表示未选中任何房间
            selectedRoomData: [], // 当前选中房间的标注点数据列表（坐标点）
            currentPoint: { x: '', y: '' }, // 当前鼠标所在位置或用户点击的坐标点，初始化为空字符串
            moveDistance: { value: 100 }, // 平移模式下每次移动的默认距离（单位：像素）
            autoAddMode: true, // 是否处于自动添加点的模式，true 表示开启，点击后自动添加点
            tempPoint: null, // 当前准备添加的“临时点”，可用于检测重叠、预览显示等逻辑
            lastPoint: null, // 最后一次成功添加的点，用于辅助连线或判断操作顺序等
            firstPoint: null, // 第一个添加的点，用于构成封闭路径或作为参考定位点
            show_lastPoint: null, // 用于可视化显示的“最后点”，不一定等于 lastPoint，可能用于辅助渲染
            dragStatus: true, // 拖拽操作状态，true 表示当前允许拖拽，false 表示禁用拖拽
            drawStatus: false, // 绘图模式状态，true 表示当前正在进行绘制操作，false 表示非绘制状态
            showEditDialog: false,
            editingIndex: null,
            editingPoint: {
                x: 0,
                y: 0
            },
        };
    },

    watch: {
        // 监听选中房间数据的变化
        selectedRoomData(newData) {
            // 如果房间数据有内容，则将插入索引设置为当前数据长度（即在末尾插入）
            if (newData.length > 0) {
                this.insertData.startIndex = newData.length;
            } else {
                // 如果为空，则插入索引置为 0（起始位置）
                this.insertData.startIndex = 0;
            }
        }
    },

    mounted() {
        // 组件挂载完成后，调用方法从后端或其他来源拉取房间数据
        this.fetchRoomData();
        this.calculatePolygonLength(points)
        // 添加键盘监听事件，用于响应用户快捷键操作（如删除、移动等）
        window.addEventListener('keydown', this.handleKeyPress);
    },
    beforeUnmount() {
        // 在组件卸载前移除键盘监听，避免内存泄露或重复绑定
        window.removeEventListener('keydown', this.handleKeyPress);
    },
    computed: {
        // 计算属性：返回确认按钮的文字说明，视当前临时点的状态而定
        getConfirmButtonText() {
            if (this.tempPoint) {
                // 如果存在临时点，则判断是否位置冲突
                return this.isOverlapping ? '非法位置' : '确认添加';
            }
            // 否则返回无临时点提示
            return '无临时点';
        },

        // 计算属性：判断当前临时点是否与已有点重叠
        isOverlapping() {
            // 如果没有临时点，直接返回 false
            if (!this.tempPoint) return false;
            // 判断点是否冲突（重叠），容差为 5 像素以内
            const pointConflict = this.selectedRoomData.some(point =>
                this.calculateDistance(point, this.tempPoint) < 5
            );
            // 【注释掉的功能：线段重叠判断】
            // 如果启用，可以判断新点是否靠近现有线段（容差 3 像素）
            // const lineConflict = this.selectedRoomData.some((point, index) => {
            //     const nextPoint = this.selectedRoomData[(index + 1) % this.selectedRoomData.length];
            //     return this.pointToLineDistance(this.tempPoint, point, nextPoint) < 3;
            // });

            // 目前只返回点冲突结果
            return pointConflict;
        }
    },

    methods: {
        // 修改后的保存方法
        handleSave() {
            // 判断是否选择了房间，如果没有选择房间，则提示错误信息
            if (!this.selectedRoom) {
                this.$message.error('请先选择房间');
                return;
            }

            // 判断选择的房间数据是否至少有三个点，如果小于三个点则不能构成房间，提示错误信息
            if (this.selectedRoomData.length < 3) {
                this.$message.error('至少需要三个点才能构成房间');
                return;
            }

            // 显示加载提示框，锁定界面并提示“数据存储中...”
            const loading = this.$loading({
                lock: true,
                text: '数据存储中...',
                spinner: 'el-icon-loading',
                background: 'rgba(0, 0, 0, 0.7)'
            });

            // 整理数据：将 selectedRoomData 中的点数据转换为二维数组的格式
            let sendPoints = []
            for (let i = 0; i < this.selectedRoomData.length; i++) {
                let tempPoint = []
                tempPoint.push(this.selectedRoomData[i].x)
                tempPoint.push(this.selectedRoomData[i].y)
                sendPoints.push(tempPoint)
            }

            // 构造请求数据，包括房间的坐标、面积、长度等信息
            const requestData = {
                user_id: 1, // 这里用 1 作为示例，实际情况中可以替换为当前登录用户的 ID
                room_id: this.selectedRoom.id, // 当前选择的房间 ID
                room_data: sendPoints, // 整理后的房间坐标数据
                data_max_x: Math.max(...this.selectedRoomData.map(p => p.x)), // 获取房间坐标中的最大 x 值
                data_max_y: Math.max(...this.selectedRoomData.map(p => p.y)), // 获取房间坐标中的最大 y 值
                default_start_x: this.selectedRoomData[0].x, // 获取房间第一个点的 x 坐标
                default_start_y: this.selectedRoomData[0].y, // 获取房间第一个点的 y 坐标
                room_area: this.calculatePolygonArea(this.selectedRoomData), // 计算房间的面积
                room_length: this.calculatePolygonLength(this.selectedRoomData), // 计算房间的周长
            };

            // 调用 API 更新房间标签
            updateRoomLabelById(requestData)
                .then(response => {
                    // 根据响应状态判断保存是否成功
                    if (response.status === 200) {
                        this.$message.success('保存成功');
                        this.selectedRoom.is_label = 1; // 更新房间的标签状态
                        this.fetchRoomData(); // 重新加载房间数据
                    } else {
                        this.$message.error(response.msg || '保存失败');
                    }
                })
                .catch(error => {
                    console.error('保存失败:', error);
                    this.$message.error(error.message || '保存失败，请检查网络连接');
                })
                .finally(() => {
                    // 不论请求成功或失败，关闭加载提示
                    loading.close();
                });
        },

        // 工具拖动事件处理函数
        handelToolDrag(opt) {
            this.$refs.drawingCanvas.redraw(); // 重新绘制画布
            // 切换工具栏按钮，隐藏标签管理弹框
            this.isFocus = opt;
            if (this.dragStatus) {
                return;
            }
            // 切换拖拽和绘图模式状态
            this.dragStatus = !this.dragStatus;
            this.drawStatus = !this.drawStatus;
        },

        // 绘制点操作处理函数
        handleDrawPoint(opt) {
            // 设置所有选中房间的数据点为可见
            this.selectedRoomData.forEach(point => {
                point.visible = true;
            });

            // 如果有临时点，清除并重绘画布
            if (this.tempPoint) {
                this.tempPoint = null;
                this.lastPoint = null;
                this.$refs.drawingCanvas.redraw();
            }

            // 切换工具栏按钮，隐藏标签管理弹框
            this.isFocus = opt;
            if (this.drawStatus) {
                return;
            }
            // 切换绘图和拖拽模式状态
            this.drawStatus = !this.drawStatus;
            this.dragStatus = !this.dragStatus;
        },

        // 插入点操作：在指定位置插入新点
        insertPointAfter() {
            // 验证插入点索引有效性（转换为0-based索引）
            const index = this.insertData.startIndex - 1;
            console.log(index)
            if (index < -1 || index >= this.selectedRoomData.length) {
                this.$message.error('无效的索引范围');
                return;
            }

            // 验证新点的坐标是否有效（x 和 y 不能为空）
            if (this.insertData.newPoint.x === null || this.insertData.newPoint.y === null) {
                this.$message.warning('请填写完整坐标');
                return;
            }

            // 创建新点实例
            const newPoint = new Point(
                this.insertData.newPoint.x,
                this.insertData.newPoint.y
            );

            // 冲突检测：检查新点是否与已有点重叠
            if (this.checkAutoOverlap(newPoint)) {
                this.$message.warning('新点位置与现有图形冲突');
                return;
            }

            // 执行插入操作：将新点插入到指定位置
            this.selectedRoomData.splice(index + 1, 0, newPoint);
            this.insertData.startIndex = this.selectedRoomData.length;

            // 重置表单数据
            this.insertData.newPoint = { x: null, y: null };
            // 重绘画布
            this.$refs.drawingCanvas.redraw();

            this.$message.success(`成功在${index + 1}号点后插入新点`);
        },

        // 计算两点之间的距离
        calculateDistance(p1, p2) {
            const dx = p2.x - p1.x; // x 坐标差值
            const dy = p2.y - p1.y; // y 坐标差值
            return Math.sqrt(dx * dx + dy * dy); // 使用勾股定理计算距离
        },




        // 选择房间
        selectRoom() {
            // 根据选择的房间ID查找对应的房间对象
            const room = this.rooms.find(r => r.id === this.selectedRoomId);
            if (room) {
                // 如果找到房间，设置 selectedRoom 为该房间对象，并将房间数据转换为 Point 对象
                this.selectedRoom = room;
                this.selectedRoomData = room.room_data.map(p => new Point(p[0], p[1]));
                // 重新绘制画布
                this.$refs.drawingCanvas.redraw();
            } else {
                // 如果没有找到房间，则清空房间数据
                this.selectedRoomData = [];
            }
        },

        // 处理房间选择
        handleRoomSelected(roomId) {
            // 设置选中的房间ID，并调用 selectRoom() 方法更新房间数据
            this.selectedRoomId = roomId;
            this.selectRoom();
        },

        // 重置房间数据
        handleReset() {
            // 将房间数据重置为当前房间的原始数据
            this.selectedRoomData = this.selectedRoom.room_data.map(p => new Point(p[0], p[1]));
            // 更新插入数据的起始索引
            this.insertData.startIndex = this.selectedRoomData.length;
            // 重新绘制画布
            this.$refs.drawingCanvas.redraw();
        },

        // 撤销上一步操作（删除最后一个点）
        handleUndo() {
            // 删除房间数据中的最后一个点
            this.selectedRoomData.splice(this.selectedRoomData.length - 1, 1);
            // 更新插入数据的起始索引
            this.insertData.startIndex = this.selectedRoomData.length;
            // 重新绘制画布
            this.$refs.drawingCanvas.redraw();
        },

        // 处理标签切换时的操作
        handleTabChange(activeName) {
            console.log('当前激活的tab:', activeName);
            // 切换时更新当前模式
            this.currentMode = activeName;

            // 如果切换到插入标签，清空插入数据表单
            if (activeName === 'insert') {
                this.show_lastPoint = null;
                this.insertData.newPoint = { x: null, y: null };
            }

            // 如果切换到移动标签，重置临时点
            if (activeName === 'move') {
                this.tempPoint = null;
            }
        },

        // 处理模式切换时的操作
        handleModeChange(newVal) {
            if (newVal) {
                // 启用自动添加模式
                this.$message.success('已启用自动添加模式');
                this.tempPoint = null;
                this.$refs.drawingCanvas.redraw();
            } else {
                // 切换为手动模式
                this.show_lastPoint = null;
                this.$message.info('已切换为手动模式');
            }
        },

        // 移动点的操作
        movePoint(direction) {
            // 将所有点设置为可见
            this.selectedRoomData.forEach(point => {
                point.visible = true;
            });

            // 获取基准点，自动模式下使用最后一个点
            let basePoint = this.autoAddMode ?
                this.selectedRoomData[this.selectedRoomData.length - 1] :
                (this.tempPoint || this.selectedRoomData[this.selectedRoomData.length - 1]);

            // 如果基准点未定义，自动模式下使用新创建的(0,0)点
            if (!basePoint && this.autoAddMode) {
                basePoint = new Point(0, 0);
                this.$message.success('为您创建新点，基于圆点移动');
            }
            // 如果基准点未定义，手动模式下使用新创建的(0,0)点
            if (!basePoint && !this.autoAddMode) {
                basePoint = new Point(0, 0);
                this.selectedRoomData.push(basePoint);
                this.$refs.drawingCanvas.redraw();
                this.$message.success('为您创建新点，坐标为(0,0)');
                return;
            }

            // 计算新的坐标点
            const newPoint = new Point(basePoint.x, basePoint.y);
            const distance = this.moveDistance.value || 0;

            // 根据方向调整坐标
            switch (direction) {
                case 'up':
                    newPoint.y += distance;
                    break;
                case 'down':
                    newPoint.y -= distance;
                    break;
                case 'left':
                    newPoint.x -= distance;
                    break;
                case 'right':
                    newPoint.x += distance;
                    break;
            }

            // 自动模式下处理逻辑
            if (this.autoAddMode) {
                if (this.checkAutoOverlap(newPoint)) {
                    this.$message.warning('添加位置与已有图形重叠');
                    return;
                }

                // 向房间数据中添加新点并重新绘制
                this.selectedRoomData.push(newPoint.clone());
                this.lastPoint = newPoint.clone();
                this.show_lastPoint = newPoint.clone();
                this.$refs.drawingCanvas.redraw();
            } else {
                // 手动模式下，保持原有逻辑
                this.tempPoint = newPoint.clone();
                this.lastPoint = this.selectedRoomData[this.selectedRoomData.length - 1];
                this.firstPoint = this.selectedRoomData[0];

                this.$refs.drawingCanvas.redraw();
            }
        },

        // 放弃临时点
        quitTempPoint() {
            if (!this.tempPoint) return;
            this.tempPoint = null;
            this.$refs.drawingCanvas.redraw();
        },

        // 确认临时点并将其添加到房间数据中
        confirmTempPoint() {
            if (!this.tempPoint) return;
            this.selectedRoomData.push(this.tempPoint);
            this.lastPoint = this.tempPoint;
            this.tempPoint = null;
            this.$refs.drawingCanvas.redraw();
        },

        // 处理键盘按键事件，控制点的移动
        handleKeyPress(e) {
            const directions = {
                ArrowUp: 'up',
                ArrowDown: 'down',
                ArrowLeft: 'left',
                ArrowRight: 'right'
            };

            // 判断按键是否是方向键
            if (directions[e.key]) {
                e.preventDefault(); // 阻止默认事件
                this.movePoint(directions[e.key]); // 调用移动点的方法
            }
        },

        // 处理点的显示/隐藏操作
        handleVisibilityChange(index) {
            // 根据点的可见性状态显示相应的消息
            this.$message[
                this.selectedRoomData[index].visible ? 'success' : 'info'
                ](`点 ${index + 1} 已${this.selectedRoomData[index].visible ? '显示' : '隐藏'}`);
            this.$refs.drawingCanvas.redraw();
        },

        // 编辑点的坐标
        editPoint(index) {
            this.editingIndex = index; // 保存当前要编辑的点的索引
            this.editingPoint = { ...this.selectedRoomData[index] }; // 复制当前点数据，防止直接修改
            this.showEditDialog = true; // 打开弹窗
        },

        confirmEdit() {
            if (this.editingIndex !== null) {
                const tempPoint = { ...this.editingPoint };

                // ✅ 空值或非法值校验
                if (
                    tempPoint.x === null ||
                    tempPoint.y === null ||
                    tempPoint.x === '' ||
                    tempPoint.y === '' ||
                    isNaN(tempPoint.x) ||
                    isNaN(tempPoint.y)
                ) {
                    this.$message.warning("请输入有效的 X/Y 坐标！");
                    return;
                }

                // ✅ 判断是否与其他点冲突
                const conflict = this.selectedRoomData.some((point, index) => {
                    return index !== this.editingIndex &&
                        this.calculateDistance(point, tempPoint) < 5;
                });

                if (conflict) {
                    this.$message.error("编辑失败：与其他点坐标冲突！");
                    return;
                }

                // ✅ 更新点数据
                this.$set(this.selectedRoomData, this.editingIndex, {
                    ...this.selectedRoomData[this.editingIndex],
                    x: Number(tempPoint.x),
                    y: Number(tempPoint.y)
                });

                this.$refs.drawingCanvas.redraw();
                this.$message.success("编辑成功！");
                this.showEditDialog = false;
            }
        },



        // 移除指定的点
        removePoint(index) {
            // 从房间数据中删除指定的点
            this.selectedRoomData.splice(index, 1);
            // 更新插入数据的起始索引
            this.insertData.startIndex = this.selectedRoomData.length;
            // 重新绘制画布
            this.$refs.drawingCanvas.redraw();
        },

        // 检查点是否与现有图形重叠
        checkAutoOverlap(tempPoint) {
            if (!tempPoint) return false;

            // 点重叠检测（5像素容差）
            const pointConflict = this.selectedRoomData.some(point =>
                this.calculateDistance(point, tempPoint) < 5
            );

            return pointConflict;
        },
        //用于数字格式化显示千分位分隔符，例如：1234567 → 1,234,567。
        formatNumberWithCommas(cellValue) {
            if (cellValue == null) return '';
            return cellValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        },

// 计算多边形面积的方法（结果为平方米）
        calculatePolygonArea(points) {
            // 如果传入的点数少于3个，无法形成多边形，直接返回0
            if (points.length < 3) return 0;

            let area = 0;
            for (let i = 0; i < points.length; i++) {
                const j = (i + 1) % points.length;
                area += points[i].x * points[j].y;
                area -= points[j].x * points[i].y;
            }

            // 计算出的面积单位为平方毫米（像素坐标近似毫米），转换为平方米（除以 1,000,000）
            return (Math.abs(area / 2) / 1000000).toFixed(2);

        },

// 计算多边形周长的方法（单位为毫米）
        calculatePolygonLength(points) {
            // 如果传入的点数少于2个，无法形成多边形，直接返回0
            if (points.length < 2) return 0;

            let length = 0; // 初始化周长变量
            // 遍历所有点，计算相邻两点之间的距离
            for (let i = 0; i < points.length; i++) {
                if(points[i].category==='wall'){
                const j = (i + 1) % points.length;
                const dx = points[j].x - points[i].x;
                const dy = points[j].y - points[i].y;
                length += Math.sqrt(dx * dx + dy * dy);
                }
            }

            // 返回多边形周长（保留一位小数，单位为毫米，可根据需要换算为米）
            return (length / 1000).toFixed(2); // 转换为米
        },


// 确认操作的方法
        handleConfirmAction() {
            // 检查当前图形是否与已有图形重叠，如果重叠，弹出警告
            if (this.isOverlapping) {
                this.$message.warning('添加位置与已有图形重叠');
                return;
            }

            // 如果有临时点，则确认该点
            if (this.tempPoint) {
                this.confirmTempPoint();
            } else {
                // 如果没有临时点，且房间数据为空，则提示用户先添加起始点
                if (this.selectedRoomData.length === 0) {
                    this.$message.warning('请先添加起始点');
                    return;
                }
                // 否则，将最后一个点作为临时点
                this.tempPoint = this.selectedRoomData[this.selectedRoomData.length - 1].clone();
            }
        },

// 获取房间数据的方法
        fetchRoomData() {
            // 检查注释房间ID是否为-1，如果是，可以执行某些操作（具体逻辑待补充）
            if(this.annotation_room_id === -1){
                // 这里可以添加处理注释房间ID为-1的逻辑
            }

            // 创建请求体，包含用户ID和房屋ID
            const requestBody = {
                user_id: this.user_id,  // 当前用户ID
                house_id: this.house_id  // 当前房屋ID
            };
            // let url = this.$serverUrl + 'getAnnotationHouseById'
            // // 通过axios向服务器发送POST请求，获取房间数据
            // axios.post(url, requestBody)
            // 通过axios向服务器发送POST请求，获取房间数据
            let ur
            axios.post('http://192.168.51.67:8888/getAnnotationHouseById', requestBody)
                .then(response => {
                    const { status, msg, data } = response.data; // 解构响应数据
                    if (status === 200) {
                        // 如果响应成功，将返回的房间列表存入rooms
                        this.rooms = data.room_list;
                        // 如果房间列表不为空，设置默认选中的房间数据
                        if (this.rooms.length > 0) {
                            this.selectedRoom = this.rooms[0];  // 选择第一个房间
                            this.selectedRoomId = this.selectedRoom.id;  // 设置房间ID
                            // 将房间数据转换为Point对象并存储
                            this.selectedRoomData = this.selectedRoom.room_data.map(p => new Point(p[0], p[1]));
                            // 设置插入数据的起始索引
                            this.insertData.startIndex = this.selectedRoomData.length || 1;
                            // 重新绘制画布
                            this.$refs.drawingCanvas.redraw();
                        }
                    } else {
                        // 如果响应状态不为200，打印错误信息
                        console.error(msg);
                    }
                })
                .catch(error => {
                    // 如果请求失败，打印错误信息
                    console.error('获取房间数据失败:', error);
                });
        },



    }
};
</script>

<style scoped>

.container{
    display: flex;
    height: 100vh; /* 占满整个视口高度 */

}

.sidebar-left {
    width: 4vw; /* 或使用固定宽度如 240px */

    padding: 1rem 0.5rem;
    box-sizing: border-box;

    height: 100vh; /* 占满屏幕高度 */
    display: flex;
    flex-direction: column;
    align-items: center;
}

.tool-icon {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 1rem;
    cursor: pointer;
    color: #606266;
}

.tool-icon:hover,
.tool-icon.focus {
    color: #409EFF;
}

.tool-icon i {
    font-size: 20px;
}

.tool-label {
    font-size: 12px;
    margin-top: 4px;
}

.sidebar-right {
    position: absolute; /* 或 fixed，看你是否希望它随页面滚动 */
    right: 0;            /* 紧贴右边 */
    top:4rem;
    width: 450px;
    height: 100vh;       /* 全屏高度 */
    //width: 20vw;
}
/* 新增：布局容器 */
.commentResult {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    height: 100%;

    /* 首个子元素顶部对齐 */
    & > :first-child {
        margin-top: 0;
        padding-top: 0;
    }
}
/* 输入框统一宽度 */
.form-input {
    width: 220px !important;  /* 固定宽度 */
}

 .custom-descriptions .el-descriptions__body {
     column-gap: 20px; /* 控制两列之间的间距 */
 }

.desc-value {
    color: #303133;
    font-weight: bold;
}
/* 操作按钮容器 */
.form-action {
    position: relative;
    height: 48px;  /* 设定明确高度 */
}

.form-action ::v-deep(.el-form-item__content) {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
}
.control-wrapper {
    display: flex;
}
.coordinate-item
{
    padding: 2px 6px;
    border-radius: 4px;

}
.custom-tabs {
    height: 300px;  /* 整体高度 */
}

/* 坐标显示样式 */
.coordinate-display1 {

    display: flex;
    gap: 12px;
    margin-left: auto; /* 右侧对齐 */

}
.inner-label {
    font-size: 12px;
    padding: 0 4px;
    position: relative;
    top: -1px;
}


/* 在style部分添加 */
.temp-coordinate {
    display: flex;
    gap: 15px;
    margin-right: 20px;
    align-items: center;
}

.coord-item {
    background: #f5f7fa;
    padding: 5px 10px;
    border-radius: 4px;
    font-family: monospace;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 调整按钮样式 */
.el-button.is-circle {
    padding: 5px;
    margin: 2px;
}

.el-card {
    margin-bottom: 0 !important;

    .el-card__header {
        padding: 12px 20px;
    }

    .el-card__body {
        padding: 15px;
    }
}
/* 卡片顶部处理 */
.el-card {
    &__header {
        padding: 12px 20px !important;
        border-bottom: none !important;
    }

    &:first-child {
        margin-top: 0;
    }
}
.resultArea {
    max-height: 320px;

}
/* 表头居中 */
.el-table th > .cell {
    display: flex;
    justify-content: center;
}

/* 表格行内容垂直居中 */
.el-table td {
    vertical-align: middle;
}

/* 显隐开关居中 */
.el-table .el-switch {
    display: flex;
    justify-content: center;
}

/* 表格行内容垂直居中 */
.el-table td {
    vertical-align: middle;
}

.container {
    padding: 20px;
    background-color: #f5f7fa;
}


.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.el-row {
    margin-bottom: 20px;

    &:last-child {
        margin-bottom: 0;
    }
}

.direction-buttons {
    text-align: center;
}

.el-table {
    margin-top: 15px;
}

.el-form-item {
    margin-bottom: 18px;
}

.el-input-number {
    width: 50%;
}

.el-button--mini {
    padding: 5px 10px;
}

.direction-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 10px 0;
}
.button-container .el-button {
    width: 100%;
}
.direction{
    display: flex;
    flex-direction: row;
}
.direction-keyboard {
    flex: 0.5;
    margin-left:20px;
    margin-right: 25px;
}

.direction-row {
    display: flex;
    justify-content: center;
    margin: 8px 0;

    .el-button {
        margin: 0 5px;
        width: 80px;
    }
}

.add-btn {
    margin-top: 50px;
    width: 100px;
    height:40px ;
}

.cancel-btn {
    margin-top: 50px;
    width: 100px;
    height:40px ;
}
.tool-divider {
    height: 1px;
    background-color: #dcdfe6;
    margin: 0.5rem 0;
}


.insert-point .el-form-item {
    margin-bottom: 18px;
}

.insert-point .el-input-number {
    width: 200px;
}

.el-row {
    margin-bottom: 20px;

    &:last-child {
        margin-bottom: 0;
    }
}

.toolFeatures {
    padding-left: 0;
    margin-left: 0;
}

.el-card {
    margin-bottom: 20px;

    &:last-child {
        margin-bottom: 0;
    }
}

.container {
    padding-left: 0;
    margin-left: 0;
}

/* 添加过渡动画 */
.el-switch {
    transition: all 0.3s ease;
}

/* 隐藏点的半透明效果 */
.hidden-point {
    opacity: 0.3;
    filter: grayscale(80%);
}

@import "../../../assets/css/DatasetManage/font-awesome.min.css";
@import "../../../assets/css/DatasetManage/style.css";
@import "../../../assets/css/DatasetManage/switch.css";
</style>
