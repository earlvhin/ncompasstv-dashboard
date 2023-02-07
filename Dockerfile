# stage 1
FROM public.ecr.aws/lambda/nodejs:12 as node
WORKDIR /app
COPY . .
RUN npx npm-force-resolutions
RUN npm install
RUN npm run build_env --c $ENV_NAME
RUN echo $ENV_NAME
RUN ls /app/dist/dashboard-material

# stage 2
FROM public.ecr.aws/nginx/nginx:alpine
COPY --from=node /app/dist/dashboard-material/assets/env/nginx.conf /etc/nginx/nginx.conf
COPY --from=node /app/dist/dashboard-material /usr/share/nginx/html
RUN ls /usr/share/nginx/html
EXPOSE 80