<?php

namespace App\Exceptions\SmartCapture;

/**
 * Thrown when the provider reports that the requested model does not exist or is
 * not available to this API key (HTTP 404 / 400 "model not found").
 *
 * This is the ONLY error class that may trigger a substitute model attempt,
 * because re-sending to a different model is the actual remedy. Rate limits,
 * server errors, timeouts and parse failures must not retry.
 */
class AiModelUnavailableException extends \Exception
{
}
