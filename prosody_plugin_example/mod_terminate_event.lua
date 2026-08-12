-- mod_terminate_event

-- --------------------------
-- Makeshift Prosody File to report room terminations to Rocket.Chat
-- ASYNC Http Request Code originating from https://github.com/jitsi-contrib/prosody-plugins/blob/main/event_sync/mod_event_sync_component.lua
-- Consider using their code if you want to monitor your Jitsi instance, this file is only for updating Rocket.Chat
-- --------------------------


local json = require "util.json";
local jid = require 'util.jid';
local http = require "net.http";
local timer = require 'util.timer';


local api_timeout = 20;
local api_retry_count = 3;
local api_retry_delay = 5;
local api_headers = false;

-- Option for user to control HTTP response codes that will result in a retry.
-- Defaults to returning true on any 5XX code or 0
local api_should_retry_for_code = module:get_option("api_should_retry_for_code", function (code)
	return code >= 500;
end)

-- common HTTP headers added to all API calls
local http_headers = {
	["User-Agent"] = "Prosody ("..prosody.version.."; "..prosody.platform..")";
	["Content-Type"] = "application/json";
};
if api_headers then -- extra headers from config
	for key, value in pairs(api_headers) do
		http_headers[key] = value;
	end
end

local function async_http_request(url, options, callback, timeout_callback, retries)
    local completed = false
    local timed_out = false
    local _retries = retries or api_retry_count

    local function cb_(response_body, response_code)
        if not timed_out then -- request completed before timeout
            completed = true
            if (response_code == 0 or api_should_retry_for_code(response_code)) and _retries > 0 then
                module:log("warn", "API Response code %d. Will retry after %ds", response_code, api_retry_delay)
                timer.add_task(
                    api_retry_delay,
                    function()
                        async_http_request(url, options, callback, timeout_callback, _retries - 1)
                    end
                )
                return
            end

            module:log("info", "%s %s returned code %s", options.method, url, response_code)

            if callback then
                callback(response_body, response_code)
            end
        end
    end

    local request = http.request(url, options, cb_)

    timer.add_task(
        api_timeout,
        function()
            timed_out = true

            if not completed then
                http.destroy_request(request)
                if timeout_callback then
                    timeout_callback()
                end
            end
        end
    )
end




module:log("info", "[Hook] Registering hook for room termination.");
module:hook("muc-room-destroyed", function (event)
	module:log("info", "[Hook] Notified of room destruction: %s", event.room);
	local payload = {
		['auth'] = '<ADD YOUR PRESHARED KEY HERE>';
		['id'] = event.room.jid;
	};

	async_http_request('<ENTER YOUR ROCKETCHAT HOOK URL HERE (CHECK README.MD FOR DETAILS)>', {
		headers = http_headers;
		method = "POST";
		body = json.encode(payload);
})
end); 


