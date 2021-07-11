const zip = new JSZip();

let user, repository, ref, dir;

let mainDir = "";

function getUrlData(url) {
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (error) {
    alert("Please enter a valid URL");
    document.getElementById("loader").style.display = "none";
    document.getElementById("button").disabled = false;
    return;
  }

  let urlParserRegex = /^[/]([^/]+)[/]([^/]+)[/]tree[/]([^/]+)[/](.*)/;

  try {
    [url, user, repository, ref, dir] = urlParserRegex.exec(parsedUrl.pathname);
  } catch (error) {
    alert("Please enter a valid URL");
    document.getElementById("loader").style.display = "none";
    document.getElementById("button").disabled = false;
  }

  mainDir = dir;

  return [user, repository, ref, dir];
}

let size = 0;
let counter = 0;
const fetchPublicFile = async (user, repository, ref, dir) => {
  const response = await fetch(
    `https://raw.githubusercontent.com/${user}/${repository}/${ref}/${dir}`,
    {}
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.statusText} for ${dir}`);
  }

  addToZip(response.blob(), dir);
};

async function main(url) {
  if (url != "") {
    let [user, repository, ref, dir] = getUrlData(url);
    document.getElementById("loader").style.display = "block";
    document.getElementById("button").disabled = true;
    viaContentsApi({
      user,
      repository,
      directory: dir,
      token:
        document.getElementById("token").value != ""
          ? document.getElementById("token").value
          : "",
    }).then((data) => {
      size = data.length;
      data.forEach((entry) => {
        fetchPublicFile(user, repository, ref, entry);
      });
    });
  } else {
    alert("Please enter a URL!");
    return;
  }
}

async function addToZip(blob, dir) {
  (await zip).file(dir.replace(mainDir + "/", ""), blob, {
    binary: true,
  });
  counter++;

  if (size == counter) {
    await (
      await zip
    )
      .generateAsync({
        type: "blob",
      })
      .then((blob) => {
        var reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = function () {
          var base64data = reader.result;
          document.body.innerHTML += `<a style="display:none;" id="download" download='${
            repository + "/" + mainDir + ".zip"
          }' href='${base64data}'>download </a>`;
          document.getElementById("loader").style.display = "none";
          document.getElementById("button").disabled = false;
          document.getElementById("token").value = localStorage.getItem("token")
            ? localStorage.getItem("token")
            : "";
          document.getElementById("download").click();
        };
      });
  }
}
