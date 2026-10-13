"""Require all uploaded assets, sizes and GitHub SHA-256 digests before publish."""
import argparse
import json
from pathlib import Path
from release_lib import digest, names

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("directory", type=Path)
parser.add_argument("metadata", type=Path)
parser.add_argument("--version", required=True)
parser.add_argument("--tag", required=True)
args = parser.parse_args()
release = json.loads(args.metadata.read_text(encoding="utf-8"))
if release["tag_name"] != args.tag or release["draft"] is not True or release["prerelease"] is not False:
    raise ValueError("Unexpected remote release metadata")
assets = release["assets"]
if len(assets) != len(names(args.version)) or {a["name"] for a in assets} != set(names(args.version)):
    raise ValueError("Unexpected uploaded asset inventory")
for asset in assets:
    data = (args.directory / asset["name"]).read_bytes()
    if asset["state"] != "uploaded" or asset["size"] != len(data) or asset.get("digest") != "sha256:" + digest(data):
        raise ValueError("Remote asset mismatch: " + asset["name"])
print("Verified all uploaded assets and SHA-256 digests before publication.")
