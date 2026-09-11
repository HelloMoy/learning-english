"use client";

import { useSeekStep } from "@/hooks/use-seek-step/use-seek-step";
import { parseSeekStepSeconds, SEEK_STEP_OPTIONS_SECONDS } from "@/lib/seek-run/seek-run";

import { Menu } from "@vidstack/react";
import { DefaultMenuButton, DefaultMenuRadioGroup } from "@vidstack/react/player/layouts/default";
import { Timer } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * The seek-step setting, as an entry in the player's own settings menu.
 *
 * @remarks
 * How far a double tap on an edge of the video skips — five, ten or twenty
 * seconds — chosen where a learner already looks for playback settings, beside
 * Speed and Accessibility. It renders nothing on its own; it is meant for a
 * `DefaultVideoLayout` slot, and `LessonVideoPlayer` mounts it in
 * `settingsMenuItemsEnd`.
 *
 * **It is built from the library's own menu parts, not from this project's
 * `DropdownMenu`.** `Menu.Root` with `DefaultMenuButton` and
 * `DefaultMenuRadioGroup` is the exact composition Vidstack's `DefaultSpeedMenu`
 * uses, so this entry inherits the gear button, the popover's placement in
 * each layout, the focus handling, the `menuitemradio` semantics, and the
 * `vds-*` theme classes — including the small layout's sheet, which is the
 * shape an iPhone learner actually gets, and the placement inside the pinned
 * player when the video fills the viewport. Rebuilding those for one setting
 * would put three regressions where the gesture is most used.
 *
 * **The radio group speaks `string`; the rest of the app speaks seconds.**
 * That conversion is done here and nowhere else — `String(...)` on the way
 * out, {@link parseSeekStepSeconds} on the way back — so no other module has
 * to know that the library's value type differs from the preference's.
 *
 * The copy comes from `next-intl` under `Components.SeekStepMenu`, not from
 * the `translations` map handed to `DefaultVideoLayout`: that map is keyed by
 * Vidstack's own English words and belongs to the library's own controls. The
 * option labels go through an ICU plural, so each locale phrases the seconds
 * itself.
 *
 * @example
 * ```tsx
 * <DefaultVideoLayout slots={{ settingsMenuItemsEnd: <SeekStepMenu /> }} />
 * ```
 *
 * @category Components
 */
export function SeekStepMenu() {
  const t = useTranslations("Components.SeekStepMenu");
  const { stepSeconds, choose } = useSeekStep();

  const secondsLabel = (seconds: number) => t("seconds", { count: seconds });

  return (
    <Menu.Root className="vds-seek-step-menu vds-menu">
      <DefaultMenuButton
        label={t("label")}
        hint={secondsLabel(stepSeconds)}
        Icon={Timer}
      />
      <Menu.Items className="vds-menu-items">
        <DefaultMenuRadioGroup
          value={String(stepSeconds)}
          options={SEEK_STEP_OPTIONS_SECONDS.map((seconds) => ({
            label: secondsLabel(seconds),
            value: String(seconds),
          }))}
          onChange={(value) => choose(parseSeekStepSeconds(value))}
        />
      </Menu.Items>
    </Menu.Root>
  );
}
