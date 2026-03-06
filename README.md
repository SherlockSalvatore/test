# 个人餐点外卖微信小程序

## 项目结构

```
miniprogram/
├── pages/
│   ├── login/           # 登录页
│   ├── user/            # 用户端
│   │   ├── index/       # 首页/菜单
│   │   ├── cart/        # 购物车
│   │   ├── orders/      # 订单列表
│   │   ├── order/       # 订单详情
│   │   └── profile/     # 个人中心
│   └── admin/           # 管理端
│       ├── menu/        # 菜单管理
│       ├── orders/      # 订单管理
│       └── stats/       # 数据统计
├── components/          # 公共组件
├── utils/               # 工具函数
├── styles/              # 公共样式
├── app.js               # 小程序入口
├── app.json             # 小程序配置
└── app.wxss             # 全局样式

cloudfunctions/
├── order/
│   ├── create/          # 创建订单
│   ├── payment/         # 支付相关
│   └── update/          # 更新订单状态
└── menu/
    ├── update/           # 新增/更新菜品
    └── delete/          # 删除菜品
```

## 开发步骤

### 1. 安装微信开发者工具

下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)

### 2. 创建云开发环境

1. 在微信开发者工具中打开项目
2. 点击「云开发」按钮，创建云开发环境
3. 记录环境ID，填入 `miniprogram/app.js` 中的 `env` 字段

### 3. 初始化数据库

在云开发控制台创建以下集合：

| 集合名 | 说明 |
|--------|------|
| menu | 菜单 |
| orders | 订单 |
| users | 用户 |

### 4. 部署云函数

右键点击 `cloudfunctions` 目录，选择「上传并部署：云端安装依赖」

### 5. 配置微信支付（可选）

如需使用支付功能：

1. 在微信商户平台开通支付
2. 修改 `cloudfunctions/order/payment/index.js` 中的支付配置
3. 设置支付回调地址

### 6. 测试运行

1. 使用微信开发者工具调试
2. 扫码在手机上真机预览

## 功能说明

### 用户端
- 浏览菜单、加入购物车
- 填写地址、下单
- 微信支付
- 查看订单状态

### 管理端
- 管理菜品（新增/编辑/删除/上下架）
- 处理订单（接单/开始制作/配送/完成）
- 查看数据统计

## 注意事项

1. 云开发环境ID需要替换为实际的环境ID
2. 管理员密码默认为 `admin123`，可在代码中修改
3. 支付功能需要申请微信支付商户号
