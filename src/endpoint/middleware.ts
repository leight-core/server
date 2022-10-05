import {IEndpointCallback} from "@leight-core/api";
import {Histogram}         from "prom-client";

const histogram = new Histogram({
	aggregator: "average",
	name:       "http_request_duration_seconds",
	help:       "Duration of HTTP requests in microseconds",
	labelNames: [
		"method",
		"route",
		"code"
	],
	buckets:    [
		0.1,
		0.3,
		0.5,
		0.7,
		1,
		3,
		5,
		7,
		10
	],
});

export const withMetrics = (endpoint: IEndpointCallback<any, any, any, any>): IEndpointCallback<any, any, any, any> => async (req, res) => {
	const timer = histogram.startTimer();
	const response = await endpoint(req, res);
	timer({method: req.method, route: req.url, code: res.statusCode});
	return response;
};
