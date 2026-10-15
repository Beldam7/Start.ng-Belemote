import { test } from "node:test";
import assert from "node:assert/strict";
import { gameName, parseRepoUrl } from "../scripts/publish-game.js";

test("reads owner, repo and branch from a GitHub link", () => {
  assert.deepEqual(parseRepoUrl("https://github.com/dav3exe/startng-battle-game"), {
    owner: "dav3exe",
    repo: "startng-battle-game",
    branch: undefined,
  });
  assert.equal(parseRepoUrl("https://github.com/a/b.git").repo, "b");
  assert.equal(parseRepoUrl("https://github.com/a/b/").repo, "b");
  assert.equal(parseRepoUrl("https://github.com/a/b/tree/gh-pages").branch, "gh-pages");
});

test("refuses links that are not GitHub repos", () => {
  for (const bad of ["http://github.com/a/b", "https://gitlab.com/a/b", "https://github.com/a", "github.com/a/b", "https://github.com/a/b; rm -rf /"]) {
    assert.throws(() => parseRepoUrl(bad), /Not a GitHub repo link/, bad);
  }
});

test("turns a repo name into a safe subdomain name", () => {
  assert.equal(gameName("StartNG_Battle.Game"), "startng-battle-game");
  assert.equal(gameName("--My  Game!!--"), "my-game");
  assert.equal(gameName("a".repeat(60)).length, 40);
});

test("refuses reserved and empty names", () => {
  assert.throws(() => gameName("api"), /reserved/);
  assert.throws(() => gameName("WWW"), /reserved/);
  assert.throws(() => gameName("___"), /can't be used/);
});
