/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

/*
 * Contains logic that will be shared between the two forwarder.ts files within the V1 and V2 directories
 *
 * NOTE: No functions were changed, just moved location
 */

import * as crypto from "crypto";
import log from "loglevel";
import { SUBSCRIPTION_FILTER_PREFIX } from "./constants";

/* unchanged, just moved location from forwarder.ts to this file */
export function generateForwarderConstructId(forwarderArn: string) {
  log.debug("Generating construct Id for Datadog Lambda Forwarder");
  return "forwarder" + crypto.createHash("sha256").update(forwarderArn).digest("hex");
}

/* unchanged just moved location from forwarder.ts to this file */
export function generateSubscriptionFilterName(functionUniqueId: string, forwarderArn: string) {
  const subscriptionFilterValue: string = crypto
    .createHash("sha256")
    .update(functionUniqueId)
    .update(forwarderArn)
    .digest("hex");
  const subscriptionFilterValueLength = subscriptionFilterValue.length;
  const subscriptionFilterName =
    SUBSCRIPTION_FILTER_PREFIX +
    subscriptionFilterValue.substring(subscriptionFilterValueLength - 8, subscriptionFilterValueLength);

  return subscriptionFilterName;
}
