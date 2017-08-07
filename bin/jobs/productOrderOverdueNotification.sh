#!/bin/sh

curl -k -X POST -H "X-Parse-Application-Id: $APP_ID" -H "X-Parse-Master-Key: $MASTER_KEY" "$PUBLIC_URL/jobs/productOrderOverdueNotification"