import Config, * as UpdateConfig from "../config";
import * as ThemeController from "../controllers/theme-controller";
import * as Misc from "../misc";
import * as Notifications from "../elements/notifications";
import * as ThemeColors from "../elements/theme-colors";
import * as ChartController from "../controllers/chart-controller";
import * as CustomThemePopup from "../popups/custom-theme-popup";
import * as Loader from "../elements/loader";
import * as DB from "../db";

export function updateActiveButton(): void {
  if (Config.customThemeId !== "") {
    const activeThemeId = Config.customThemeId;
    $(`.pageSettings .section.themes .customTheme`).removeClass("active");
    $(
      `.pageSettings .section.themes .customTheme[customThemeId=${activeThemeId}]`
    ).addClass("active");
  } else {
    let activeThemeName = Config.theme;
    if (
      Config.randomTheme !== "off" &&
      Config.randomTheme !== "custom" &&
      ThemeController.randomTheme !== null
    ) {
      activeThemeName = ThemeController.randomTheme as string;
    }
    $(`.pageSettings .section.themes .theme`).removeClass("active");
    $(
      `.pageSettings .section.themes .theme[theme=${activeThemeName}]`
    ).addClass("active");
  }
}

function updateColors(
  colorPicker: JQuery<HTMLElement>,
  color: string,
  onlyStyle = false,
  noThemeUpdate = false
): void {
  if (onlyStyle) {
    const colorID = colorPicker.find("input[type=color]").attr("id");
    if (colorID === undefined) console.error("Could not find color ID!");
    if (!noThemeUpdate && colorID !== undefined)
      document.documentElement.style.setProperty(colorID, color);
    const pickerButton = colorPicker.find("label");
    pickerButton.val(color);
    pickerButton.attr("value", color);
    if (pickerButton.attr("for") !== "--bg-color")
      pickerButton.css("background-color", color);
    colorPicker.find("input[type=text]").val(color);
    colorPicker.find("input[type=color]").attr("value", color);
    return;
  }
  const colorREGEX = [
    {
      rule: /\b[0-9]{1,3},\s?[0-9]{1,3},\s?[0-9]{1,3}\s*\b/,
      start: "rgb(",
      end: ")",
    },
    {
      rule: /\b[A-Z, a-z, 0-9]{6}\b/,
      start: "#",
      end: "",
    },
    {
      rule: /\b[0-9]{1,3},\s?[0-9]{1,3}%,\s?[0-9]{1,3}%?\s*\b/,
      start: "hsl(",
      end: ")",
    },
  ];

  color = color.replace("°", "");

  for (const regex of colorREGEX) {
    if (color.match(regex.rule)) {
      color = regex.start + color + regex.end;
      break;
    }
  }

  $(".colorConverter").css("color", color);
  const hexColor: string | undefined = Misc.convertRGBtoHEX(
    $(".colorConverter").css("color")
  );
  if (hexColor === undefined) {
    return;
  }

  color = hexColor;

  const colorID = colorPicker.find("input[type=color]").attr("id");

  if (colorID === undefined) console.error("Could not find color ID!");
  if (!noThemeUpdate && colorID !== undefined)
    document.documentElement.style.setProperty(colorID, color);

  const pickerButton = colorPicker.find("label");

  pickerButton.val(color);
  pickerButton.attr("value", color);
  if (pickerButton.attr("for") !== "--bg-color")
    pickerButton.css("background-color", color);
  colorPicker.find("input[type=text]").val(color);
  colorPicker.find("input[type=color]").attr("value", color);
}

export async function refreshButtons(): Promise<void> {
  if (Config.customTheme) {
    const customThemesEl = $(
      ".pageSettings .section.themes .allCustomThemes.buttons"
    ).empty();
    // Update custom theme buttons
    const customThemes = DB.getSnapshot().customThemes;

    if (customThemes.length < 1) {
      Notifications.add("No custom themes!", -1);
      return;
    }

    customThemes.forEach((customTheme) => {
      const activeTheme =
        Config.customThemeId === customTheme._id ? "active" : "";
      const bgColor = customTheme.colors[0];
      const mainColor = customTheme.colors[1];

      customThemesEl.append(
        `<div class="customTheme button ${activeTheme}" customThemeId='${
          customTheme._id
        }' 
        style="color:${mainColor};background:${bgColor}">
        <div class="activeIndicator"><i class="fas fa-circle"></i></div>
        <div class="text">${customTheme.name.replace(/_/g, " ")}</div>
        <div class="delButton"><i class="fas fa-trash fa-fw"></i></div>
        </div>`
      );
    });
  } else {
    // Update theme buttons
    const favThemesEl = $(
      ".pageSettings .section.themes .favThemes.buttons"
    ).empty();
    const themesEl = $(
      ".pageSettings .section.themes .allThemes.buttons"
    ).empty();

    let activeThemeName = Config.theme;
    if (
      Config.randomTheme !== "off" &&
      Config.randomTheme !== "custom" &&
      ThemeController.randomTheme !== null
    ) {
      activeThemeName = ThemeController.randomTheme as string;
    }

    const themes = await Misc.getSortedThemesList();
    //first show favourites
    if (Config.favThemes.length > 0) {
      favThemesEl.css({ paddingBottom: "1rem" });
      themes.forEach((theme) => {
        if (Config.favThemes.includes(theme.name)) {
          const activeTheme = activeThemeName === theme.name ? "active" : "";
          favThemesEl.append(
            `<div class="theme button ${activeTheme}" theme='${theme.name}' 
            style="color:${theme.mainColor};background:${theme.bgColor}">
            <div class="activeIndicator"><i class="fas fa-circle"></i></div>
            <div class="text">${theme.name.replace(/_/g, " ")}</div>
            <div class="favButton active"><i class="fas fa-star"></i></div></div>`
          );
        }
      });
    } else {
      favThemesEl.css({ paddingBottom: "0" });
    }
    //then the rest
    themes.forEach((theme) => {
      if (Config.favThemes.includes(theme.name)) {
        return;
      }

      const activeTheme = activeThemeName === theme.name ? "active" : "";
      themesEl.append(
        `<div class="theme button ${activeTheme}" theme='${
          theme.name
        }' style="color:${theme.mainColor};background:${theme.bgColor}">
        <div class="activeIndicator"><i class="fas fa-circle"></i></div>
        <div class="text">${theme.name.replace(/_/g, " ")}</div>
        <div class="favButton"><i class="far fa-star"></i></div></div>`
      );
    });
  }
  updateActiveButton();
}

export function setCustomInputs(noThemeUpdate = false): void {
  if (!DB.getSnapshot() || !DB.getSnapshot().customThemes) return;
  const customTheme = DB.getSnapshot().customThemes.filter(
    (t) => t._id === Config.customThemeId
  )[0];
  $(".pageSettings .section.themes .tabContainer .customThemeEdit #name").val(
    customTheme !== undefined ? customTheme.name : "custom"
  );
  $(
    ".pageSettings .section.themes .tabContainer .customTheme .colorPicker"
  ).each((_index, element: HTMLElement) => {
    const currentColor =
      Config.customThemeColors[
        ThemeController.colorVars.indexOf(
          $(element).find("input[type=color]").attr("id") as string
        )
      ];
    updateColors($(element), currentColor, false, noThemeUpdate);
  });
}

function toggleFavourite(themeName: string): void {
  if (Config.favThemes.includes(themeName)) {
    // already favourite, remove
    UpdateConfig.setFavThemes(Config.favThemes.filter((t) => t !== themeName));
  } else {
    // add to favourites
    const newList: Array<string> = Config.favThemes;
    newList.push(themeName);
    UpdateConfig.setFavThemes(newList);
  }
  UpdateConfig.saveFullConfigToLocalStorage();
  refreshButtons();
}

export function updateActiveTab(forced = false): void {
  // Set force to true only when some change for the active tab has taken place
  // Prevent theme buttons from being added twice by doing an update only when the state has changed
  const $presetTabButton = $(
    ".pageSettings .section.themes .tabs .button[tab='preset']"
  );
  const $customTabButton = $(
    ".pageSettings .section.themes .tabs .button[tab='custom']"
  );

  if (!Config.customTheme) {
    $customTabButton.removeClass("active");
    if (!$presetTabButton.hasClass("active") || forced) {
      $presetTabButton.addClass("active");
      refreshButtons();
    }
  } else {
    if (firebase.auth().currentUser === null) {
      $presetTabButton.addClass("active");
      return;
    }
    $presetTabButton.removeClass("active");
    if (!$customTabButton.hasClass("active") || forced) {
      $customTabButton.addClass("active");
      refreshButtons();
    }
  }
}

// Add events to the DOM

// Handle click on theme: preset or custom tab
$(".pageSettings .section.themes .tabs .button").on("click", async (e) => {
  const $target = $(e.currentTarget);
  if (firebase.auth().currentUser === null) {
    if ($target.attr("tab") === "custom")
      Notifications.add(
        "Custom themes are available to logged in users only",
        0
      );

    return;
  }
  $(".pageSettings .section.themes .tabs .button").removeClass("active");
  // $target.addClass("active"); Don't uncomment it. updateActiveTab() will add the active class itself
  setCustomInputs();
  if ($target.attr("tab") === "preset") {
    if (Config.randomTheme === "custom") UpdateConfig.setRandomTheme("off");
    UpdateConfig.setCustomTheme(false);
  } else {
    const customThemes = DB.getSnapshot().customThemes;
    if (customThemes.length >= 1) {
      if (!DB.getCustomThemeById(Config.customThemeId))
        UpdateConfig.setCustomThemeId(customThemes[0]._id);
      UpdateConfig.setCustomTheme(true);
      return;
    }
    Loader.show();
    const createdTheme = await DB.addCustomTheme({
      name: "custom",
      colors: [...Config.customThemeColors],
    });
    Loader.hide();
    if (createdTheme) {
      UpdateConfig.setCustomThemeId(DB.getSnapshot().customThemes[0]._id);
      UpdateConfig.setCustomTheme(true);
    }
  }
});

// Handle click on new custom theme button
$(".pageSettings .addCustomThemeButton").on("click", async () => {
  const newCustomTheme = {
    name: "custom",
    colors: [...Config.customThemeColors],
  };

  Loader.show();
  await DB.addCustomTheme(newCustomTheme);
  Loader.hide();
  updateActiveTab(true);
});

// Handle click on custom theme button
$(document).on(
  "click",
  ".pageSettings .section.themes .customTheme.button",
  (e) => {
    // Do not apply if user wanted to delete it
    if ($(e.target).hasClass("delButton")) return;
    const customThemeId = $(e.currentTarget).attr("customThemeId") ?? "";
    const customThemes = DB.getSnapshot().customThemes ?? [];
    if (
      customThemeId !== "" &&
      customThemes.filter((t) => t._id === customThemeId)[0]
    ) {
      UpdateConfig.setCustomThemeId(customThemeId);
      updateActiveButton();
    } else
      console.error(
        "Could not find the custom theme id attribute attached to the button clicked!"
      );
  }
);

// Handle click on favorite preset theme button
$(document).on(
  "click",
  ".pageSettings .section.themes .theme .favButton",
  (e) => {
    const theme = $(e.currentTarget).parents(".theme.button").attr("theme");
    if (theme !== undefined) toggleFavourite(theme);
    else
      console.error(
        "Could not find the theme attribute attached to the button clicked!"
      );
  }
);

// Handle click on preset theme button
$(document).on("click", ".pageSettings .section.themes .theme.button", (e) => {
  const theme = $(e.currentTarget).attr("theme");
  if (!$(e.target).hasClass("favButton") && theme !== undefined) {
    UpdateConfig.setTheme(theme);
    updateActiveButton();
  }
});

$(
  ".pageSettings .section.themes .tabContainer .customTheme input[type=color]"
).on("input", (e) => {
  const $colorVar = $(e.currentTarget).attr("id") as string;
  const $pickedColor = $(e.currentTarget).val() as string;

  updateColors($(".colorPicker #" + $colorVar).parent(), $pickedColor, true);
});

$(
  ".pageSettings .section.themes .tabContainer .customTheme input[type=color]"
).on("change", (e) => {
  const $colorVar = $(e.currentTarget).attr("id") as string;
  const $pickedColor = $(e.currentTarget).val() as string;

  updateColors($(".colorPicker #" + $colorVar).parent(), $pickedColor);
});

$(".pageSettings .section.themes .tabContainer .customTheme input[type=text]")
  .on("blur", (e) => {
    if (e.target.id === "name") return;
    const $colorVar = $(e.currentTarget).attr("id") as string;
    const $pickedColor = $(e.currentTarget).val() as string;

    updateColors($(".colorPicker #" + $colorVar).parent(), $pickedColor);
  })
  .on("keypress", function (e) {
    if (e.target.id === "name") return;
    if (e.code === "Enter") {
      $(this).attr("disabled", "disabled");
      const $colorVar = $(e.currentTarget).attr("id") as string;
      const $pickedColor = $(e.currentTarget).val() as string;

      updateColors($(".colorPicker #" + $colorVar).parent(), $pickedColor);
      $(this).removeAttr("disabled");
    }
  });

$(".pageSettings #loadCustomColorsFromPreset").on("click", () => {
  // previewTheme(Config.theme);
  $("#currentTheme").attr("href", `themes/${Config.theme}.css`);

  ThemeController.colorVars.forEach((e) => {
    document.documentElement.style.setProperty(e, "");
  });

  setTimeout(async () => {
    ChartController.updateAllChartColors();

    const themeColors = await ThemeColors.getAll();

    ThemeController.colorVars.forEach((colorName) => {
      let color;
      if (colorName === "--bg-color") {
        color = themeColors.bg;
      } else if (colorName === "--main-color") {
        color = themeColors.main;
      } else if (colorName === "--sub-color") {
        color = themeColors.sub;
      } else if (colorName === "--caret-color") {
        color = themeColors.caret;
      } else if (colorName === "--text-color") {
        color = themeColors.text;
      } else if (colorName === "--error-color") {
        color = themeColors.error;
      } else if (colorName === "--error-extra-color") {
        color = themeColors.errorExtra;
      } else if (colorName === "--colorful-error-color") {
        color = themeColors.colorfulError;
      } else if (colorName === "--colorful-error-extra-color") {
        color = themeColors.colorfulErrorExtra;
      }

      updateColors($(".colorPicker #" + colorName).parent(), color as string);
    });
  }, 250);
});

// Handles click on share custom theme button
$("#shareCustomThemeButton").on("click", () => {
  const share: string[] = [];
  $.each(
    $(".pageSettings .customTheme .customThemeEdit [type='color']"),
    (_, element) => {
      share.push($(element).attr("value") as string);
    }
  );

  const url =
    "https://monkeytype.com?" +
    Misc.objectToQueryString({ customTheme: share });

  navigator.clipboard.writeText(url).then(
    function () {
      Notifications.add("URL Copied to clipboard", 0);
    },
    function () {
      CustomThemePopup.show(url);
    }
  );
});

$(".pageSettings .saveCustomThemeButton").on("click", async () => {
  let themeName = $(
    ".pageSettings .customTheme .customThemeEdit input#name"
  ).val() as string;
  if (themeName.trim() === "") themeName = "custom";

  const newColors: string[] = [];
  $.each(
    $(".pageSettings .customTheme .customThemeEdit [type='color']"),
    (_index, element) => {
      newColors.push($(element).attr("value") as string);
    }
  );
  const snapshot = DB.getSnapshot();
  if (snapshot.customThemes.length < 1) {
    Notifications.add("No custom themes!", -1);
    return;
  }

  const customTheme = snapshot.customThemes.find(
    (t) => t._id === Config.customThemeId
  );
  if (customTheme === undefined) {
    Notifications.add("Custom theme does not exist!", -1);
    return;
  }
  const newTheme = {
    name: themeName,
    colors: newColors,
  };
  Loader.show();
  await DB.editCustomTheme(customTheme._id, newTheme);
  Notifications.add("Custom theme saved", -1);
  Loader.hide();

  ThemeController.set(true, Config.customThemeId);
  updateActiveTab(true);
});
