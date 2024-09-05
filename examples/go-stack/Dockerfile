FROM golang:1.23-alpine
WORKDIR /
COPY . .
RUN apk update && apk upgrade
RUN go build -o app
CMD ["./app"]

