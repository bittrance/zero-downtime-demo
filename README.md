# Adventures in zero-downtime companion repo

This talk draws from the material in my blog post [Zero downtime shutdown for REST APIs](https://bittrance.github.io/posts/graceful-shutdown-for-rest-apis/).

## Setup

With these preparations, it should be possible to run offline.

```shell
kind create cluster --config kind-cluster.yaml
docker run -d --rm --init \
  --name cloud-provider-kind \
  --network kind \
  -v /var/run/docker.sock:/var/run/docker.sock \
  registry.k8s.io/cloud-provider-kind/cloud-controller-manager:v0.6.0
docker pull bittrance/hello-world:spring-undertow-hello-rest
kind load docker-image bittrance/hello-world:spring-undertow-hello-rest
nave use 22.15.1
npm add express
```

## Iteration #1 - naive implementation

```shell
kubectl create namespace hello-rest
kubectl apply --namespace hello-rest -f ./hello-rest-v1.yaml
watch kubectl --namespace hello-rest get pods
```

```shell
set IP (kubectl --namespace hello-rest get services hello-rest -o jsonpath='{@.status.loadBalancer.ingress[0].ip}')
env HELLO_REST_ENDPOINT=http://$IP:8080 k6 run --no-connection-reuse ./load-rest.js
```

```shell
kubectl --namespace hello-rest rollout restart deployment hello-rest
```

Triggers "connection refused"

## Iteration #2 - prestop sleep

```shell
kubectl apply --namespace hello-rest -f ./hello-rest-v2.yaml
```

Wait for re-deploy.

```shell
env HELLO_REST_ENDPOINT=http://$IP:8080 k6 run --no-connection-reuse ./load-rest.js
```

```shell
kubectl --namespace hello-rest rollout restart deployment hello-rest
```

Error-free.

## Iteration #3 - with persistent connections

```shell
kubectl apply --namespace hello-rest -f ./hello-rest-v3.yaml
```

Wait for redeploy.

```shell
env HELLO_REST_ENDPOINT=http://$IP:8080 k6 run ./load-rest.js
```

```shell
kubectl --namespace hello-rest rollout restart deployment hello-rest
```

Undertow responds with 503.

## Node Express - almost works

```shell
nave use 22.15.1
node ./express-v1.mjs
```

```shell
telnet localhost 8080
```

Make a manual request with telnet and wait for response. Ctrl+C on node; observe that the idle connection is terminated.

Start node and telnet again but don't make a request. Ctrl+C on node; observe that node blocks.

## Node express + terminus

```shell
node ./express-v2.mjs
```

```shell
telnet localhost 8080
```

Repeat both tests from v1. Observe that both new and idle connections are terminated immediately.

## Further reading

More hello-world code examples can be found in [bittrance/hello-world](https://github.com/bittrance/hello-world). In-depth discussion on [long-lived connections in Kubernetes](https://learnk8s.io/kubernetes-long-lived-connections).
