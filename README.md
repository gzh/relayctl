# Relayctl

This is to control relays (currently with a "Socket-4" device by VKModule
http://vkmodule.com.ua/Ethernet/Socket4.html).

It supports multiple users with ACLs, orders to change relay state
over an amount of time. It also replaces the poll API provided by
vkmodule device with a websocket interface to push relay status or
order list change to the clients.



## Run the server

The command to run the server is `node server.js`.

## Configuration

See/edit `server-config.json`. There is also `htdigest.txt` which can
be maintained with `htdigest` tool from Apache or installed separately
via `npm install htdigest -g`.

Sections of config:

`roles` section maps the role names (i.e.groups of users) to the lists
of user names. (The user names are defined in `htdigest.txt`).

`views` section defines which views are available to which roles. The
keys `basic`, `advanced`, `status` and `orders` are supported (of
which the first two are probably most useful). The values
corresponding to keys are the string arrays of names of roles to which
corresponding view should be made accessible. This section is used by
the UI and does not affect the server behavior.

`groups` section defines the groups of relays so that the ACLs can be
managed in more terse fashion.

`device.address` and `device.auth` provides IP address and credentials
for accessing the vkmodule device.

`device.names` should be an array of strings and defines the names of
relays as shown in the UI.

`device.groups` assigns relays on this device to the global groups
defined in the `groups` section of the config. Zero-based relay
indices should be the memebers of that config section values.

`device.acls` maps the roles to the list of relays or relay groups to
which that role should have access. This is taken into account by both
the server and the UI. The keys in the `device.acls` section are role
names, the values are arrays (lists) of integers (which are zero-based
relay indices) or strings (which are relay group names).

## Build

Run `npm install && ng build --prod --aot --locale uk --i18n-file src/messages.uk.xlf`
(where `--locale uk --i18n-file src/messages.uk.xlf` is to build UI in Ukrainian).

## Install as Win32 service

Run `node ntservice.js install` to add an NT service named
"RelayCtl". Run `node ntservice.hs uninstall` to remove the service.