FROM golang:1.24.3 as build
WORKDIR /src
COPY . .

RUN go mod init github.com/UF-SASE-Web-Team/AI-Advisor/backend/services/auth || true
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/auth ./cmd

FROM gcr.io/distroless/base-debian12
COPY --from=build /out/auth /auth
EXPOSE 8083
USER nonroot:nonroot
ENTRYPOINT ["/auth"]
