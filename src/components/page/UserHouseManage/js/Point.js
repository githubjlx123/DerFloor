export default class Point {
    // 构造函数，接受x、y坐标作为参数
    constructor(x, y) {
        this.x = x; // 设置点的x坐标
        this.y = y; // 设置点的y坐标
        this.visible = true; // 默认点是可见的
        this.radius = 20; // 设置点的半径，默认为20
        this.color = 'red'; // 设置点的颜色，默认为红色
        this.category = 'wall'; // 设置点的类别，默认为 'wall'，可以根据需求更改
        this.curveType = 'line'; // line | ellipse
        this.axisLength = 0;     // 短轴长度
    }

    // 绘制点的方法
    draw(ctx, scale = 1) {
        // 定义一个基础半径，用于控制点的大小
        const baseRadius = 5;
        // 根据缩放比例动态调整半径，确保在缩放时点的大小合理
        const dynamicRadius = baseRadius / Math.sqrt(scale);

        // 开始绘制路径
        ctx.beginPath();
        // 绘制一个圆形，使用当前点的x, y坐标，动态调整的半径，以及完整的圆形弧度（0到2π）
        ctx.arc(this.x, this.y, dynamicRadius, 0, Math.PI * 2);
        // 设置填充颜色为红色
        ctx.fillStyle = 'red';
        // 填充圆形区域
        ctx.fill();
    }

    // 克隆当前点的方法，返回一个新的Point对象，具有相同的x、y坐标和可见性
    clone() {
        return new Point(this.x, this.y, this.visible);
    }
}
