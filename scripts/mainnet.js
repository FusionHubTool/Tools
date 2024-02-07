
const os = require('os');
const dns = require('dns');

function getDnsServers() {
  const interfaces = os.networkInterfaces();
  const dnsServers = [];

  for (const iface in interfaces) {
    for (const address of interfaces[iface]) {
      if (address.family === 'IPv4') {
        dns.resolve4(address.address, (err, addresses) => {
          if (err) {
            console.error(`Error resolving ${address.address}: ${err.message}`);
          } else {
            dnsServers.push(...addresses);
          }
        });
      } else if (address.family === 'IPv6') {
        dns.resolve6(address.address, (err, addresses) => {
          if (err) {
            console.error(`Error resolving ${address.address}: ${err.message}`);
          } else {
            dnsServers.push(...addresses);
          }
        });
      }
    }
  }

  return dnsServers;
}

console.log('DNS Servers:', getDnsServers());


async function checkVulnerabilities() {
  const [surfaceWebProgress, darkWebProgress] = await Promise.all([
    checkSurfaceWebVulnerabilities(),
    checkDarkWebVulnerabilities()
  ]);

  document.getElementById('surface-web-progress').style.width = `${surfaceWebProgress}%`;
  document.getElementById('dark-web-progress').style.width = `${darkWebProgress}%`;

  const webRtcLeakStatus = await checkWebRtcLeak();
  document.getElementById('web-rtc-leak-status').textContent = webRtcLeakStatus;

  const ipLeakStatus = await checkIpLeak();
  document.getElementById('ip-leak-status').textContent = ipLeakStatus;
}

async function checkSurfaceWebVulnerabilities() {
  let progress = 0;

  const ipResponse = await fetch('https://ipinfo.io/json');
  const ipData = await ipResponse.json();
  const org = ipData.org;
  const isVPN = org.includes('VPN') || org.includes('Proxy');
  if (isVPN) {
    progress += 50;
  }

  const leakResponse = await fetch('https://ipleak.net/json/');
  const leakData = await leakResponse.json();
  const isLeaking = leakData.isLeaking;
  if (!isLeaking) {
    progress += 50;
  }
  return progress;
}

async function checkDarkWebVulnerabilities() {
  let progress = 0;

  const ipResponse = await fetch('https://ipinfo.io/json');
  const ipData = await ipResponse.json();
  const org = ipData.org;
  const isVPN = org.includes('VPN') || org.includes('Proxy');
  if (isVPN) {
    progress += 25;
  }

  const leakResponse = await fetch('https://ipleak.net/json/');
  const leakData = await leakResponse.json();
  const isLeaking = leakData.isLeaking;
  if (!isLeaking) {
    progress += 25;
  }
  return progress;
}

async function checkWebRtcLeak() {
  try {
    async function findIP(onNewIP) {
      const myPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
      const pc = new myPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] }),
        noop = function () {},
        localIPs = {},
        ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/g;

      pc.createDataChannel("");

      pc.createOffer(function (sdp) {
        sdp.sdp.split('\n').forEach(function (line) {
          if (line.indexOf('candidate') < 0) return;
          line.match(ipRegex).forEach(ipIterate);
        });
        pc.setLocalDescription(sdp, noop, noop);
      }, noop);

      pc.onicecandidate = function (ice) {
        if (!ice || !ice.candidate || !ice.candidate.candidate || !ice.candidate.candidate.match(ipRegex)) return;
        ice.candidate.candidate.match(ipRegex).forEach(ipIterate);
      };

      function ipIterate(ip) {
        if (!localIPs[ip]) onNewIP(ip);
        localIPs[ip] = true;
      }
    }

    const localIp = await new Promise((resolve) => {
      findIP(resolve);
    });

    const externalIp = await (await fetch('https://api.ipify.org')).text();
    const vpnProviderIP = '103.86.98.0';

    if (localIp === 'none' || externalIp === vpnProviderIP) {
      return 'Secure';
    } else {
      return 'Vulnerable';
    }
  } catch (error) {
    console.error('Error checking for WebRTC leak:', error);
    return 'Unknown';
  }
}

async function checkIpLeak() {
  try {
    const response = await fetch('https://ipleak.net/json/');
    const data = await response.json();
    if (data.ip_leak) {
      return 'Vulnerable';
    } else {
      return 'Secure';
    }
  } catch (error) {
    console.error('Error checking for IP leak:', error);
    return 'Unknown';
  }
}

checkVulnerabilities();
