# 构建阶段
FROM node:18-alpine as build

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 复制构建产物到 Nginx 目录
COPY --from=build /app/build /usr/share/nginx/html

# 复制 Nginx 配置文件
COPY nginx.conf /etc/nginx/templates/default.conf.template

# 设置环境变量默认值
ENV PORT=39905

# 暴露端口
EXPOSE ${PORT}

# 启动 Nginx
CMD sh -c "envsubst '\$PORT' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'" 