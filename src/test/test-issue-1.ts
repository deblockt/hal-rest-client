import { createClient, createResource, HalProperty, HalResource, resetCache } from "../";

import * as nock from "nock";
import { test } from "tape-async";

class NotificationConfig {
    public category;
    public notificationDescription;
    public subcategory;
    public email: NotificationEmail;
}

class HalNotification extends HalResource {
    @HalProperty()
    public cellphoneSet;

    @HalProperty(NotificationConfig)
    public notificationConfigs: NotificationConfig[];
}

class NotificationEmail {
    public id;
    public enabled;
}

// mock list response
function initTests() {
  nock.cleanAll();
  resetCache();

  const json = {
  	_links: {
  		self: {
  			href: "http://test.fr/notificationConfig",
  			type: "application/hal+json"
  		},
  		updateNotificationConfigs: {
  			href: "http://test.fr/notificationConfig/update",
  			type: "application/hal+json"
  		}
  	},
  	cellphoneSet: false,
  	notificationConfigs: [
  		{
  			notificationDescription: "Your password has been reset",
  			category: "Login",
  			subcategory: "Reset_Password",
  			email: {
  				id: 3,
  				enabled: true
  			}
  		}
  	]
  };

  const testNock = nock("http://test.fr/");

  testNock
    .get("/notificationConfigs")
    .reply(200, json);
}

test("can fetch array of non hal resource", async (t) => {
  initTests();
  const fetched = await createClient('http://test.fr/').fetch('/notificationConfigs', HalNotification);
  t.equals(fetched.cellphoneSet, false);
  t.equals(fetched.notificationConfigs.length, 1);
  t.equals(fetched.notificationConfigs[0].subcategory, "Reset_Password");
  t.equals(fetched.notificationConfigs[0].email.id, 3);
});
