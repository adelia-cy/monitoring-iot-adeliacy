//Client MQTT
let client;

//Topic MQTT
const topicSuhu  = "smk/iot/sensorsuhu5";
const topicHum   = "smk/iot/sensorkelembaban5";
const topicRelay = "smk/iot/control5";
const topicStatus = "smk/iot/status5";
const topicMode = "smk/iot/mode5";

//Connect MQTT
function connectMQTT() {

  client = mqtt.connect(
    "wss://broker.hivemq.com:8884/mqtt"
  );

  //Ketika Connect
  client.on("connect", () => {

    document
      .getElementById("status")
      .innerText = "CONNECTED";

    document
      .getElementById("status")
      .classList.add("on");

    //Subscribe Topic
      client.subscribe([
      topicSuhu,
      topicHum,
      topicStatus,
      topicMode
    ]);
  });

  //Menerima Data
  client.on("message", (topic, msg) => {

    let val = msg.toString();

    let time =
      new Date().toLocaleTimeString();

    //Suhu
    if (topic === topicSuhu) {

      const suhuEl =
        document.getElementById("suhu");

      suhuEl.innerText = val + " °C";

      //Ubah ke angka
      let suhu = parseFloat(val);

      //Hapus semua class warna
      suhuEl.classList.remove(
        "hijau",
        "kuning",
        "merah"
      );

      //Kurang dari 25
      if (suhu < 25) {

        suhuEl.classList.add("hijau");
      }

      //25 - 30
      else if (suhu >= 25 && suhu <= 30) {

        suhuEl.classList.add("kuning");
      }

      //Diatas 30
      else {

        suhuEl.classList.add("merah");
      }

      updateData(time, val, null);
    }

    //Humidity
    if (topic === topicHum) {

      document
        .getElementById("hum")
        .innerText = val + " %";

      updateData(time, null, val);
    }

    //Status Relay
    if (topic === topicStatus) {

      let parts = val.split("_");

      let relay =
        parts[0].replace("R", "");

      let state = parts[1];

      let indikator =
        document.getElementById(
          "indikator" + relay
        );

      //ON
      if (state === "ON") {

        indikator.classList.remove("off");
        indikator.classList.add("on");
      }

      //OFF
      else {

        indikator.classList.remove("on");
        indikator.classList.add("off");
      }
    }
    //MODE SISTEM
if (topic === topicMode) {

  let modeText =
    document.getElementById(
      "modeText"
    );

  //MODE RELAY
  if (val === "RELAY") {

    modeText.innerText =
      "MODE RELAY";

    //Aktifkan tombol relay
    document
      .querySelectorAll(
        ".relay-card button"
      )
      .forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = "1";
      });
  }

      //MODE SUHU
      else {

        modeText.innerText =
          "MODE SUHU";

        //Nonaktifkan tombol relay
        document
          .querySelectorAll(
            ".relay-card button"
          )
          .forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = "0.5";
          });
      }
    }
  });
}

//Kontrol Relay
function relay(n, state) {

  let cmd =
    (state === "on")
    ? "ON"
    : "OFF";

  client.publish(
    topicRelay,
    `R${n}_${cmd}`
  );
}

//Simpan Data
function updateData(
  time,
  suhu,
  hum
) {

  let data =
    JSON.parse(
      localStorage.getItem("history")
    ) || [];

  data.unshift({
    waktu: time,
    suhu: suhu,
    hum: hum
  });

  if (data.length > 50)
    data.pop();

  localStorage.setItem(
    "history",
    JSON.stringify(data)
  );

  renderTable();
}

//Render Table
function renderTable() {

  const tb =
    document.querySelector(
      "#historyTable tbody"
    );

  tb.innerHTML = "";

  let data =
    JSON.parse(
      localStorage.getItem("history")
    ) || [];

  data.forEach(d => {

    let row = tb.insertRow();

    row.insertCell(0)
      .innerText = d.waktu;

    row.insertCell(1)
      .innerText =
        d.suhu
        ? d.suhu + "°C"
        : "-";

    row.insertCell(2)
      .innerText =
        d.hum
        ? d.hum + "%"
        : "-";
  });
}

//Hapus Riwayat
function clearHistory() {

  localStorage.removeItem("history");

  renderTable();
}

//Disconnect
function disconnectMQTT() {

  if (client)
    client.end();

  location.reload();
}

//Load Awal
//GANTI MODE
function setMode(mode) {

  //Kirim mode ke ESP32
  client.publish(
    topicMode,
    mode.toUpperCase()
  );
}
window.onload = () => {

  renderTable();
};