import { Button } from "@heroui/react/button";
import { Card } from "@heroui/react/card";
import { Separator } from "@heroui/react/separator";
import { Slider } from "@heroui/react/slider";
import { createRoot } from "react-dom/client";
import settingsStyles from "./settings-panel.css?inline";

function toNumber(value) {
  return Array.isArray(value) ? value[0] : value;
}

function SettingsSlider({ field, onChange, onCommit }) {
  const value = field.value;
  const displayValue = `${value}${field.unit ? ` ${field.unit}` : ""}`;

  return (
    <Slider
      aria-label={field.label}
      className="polaris-settings-slider"
      maxValue={field.max}
      minValue={field.min}
      onBlur={() => onCommit(field.key, value)}
      onChange={(nextValue) => onChange(field.key, toNumber(nextValue))}
      onChangeEnd={(nextValue) => onCommit(field.key, toNumber(nextValue))}
      onKeyUp={(event) => {
        if (["ArrowDown", "ArrowLeft", "ArrowRight", "ArrowUp", "End", "Home", "PageDown", "PageUp"].includes(event.key)) {
          onCommit(field.key, value);
        }
      }}
      step={field.step}
      value={value}
    >
      <div className="polaris-settings-slider-label">
        <span>{field.label}</span>
        <Slider.Output>{() => displayValue}</Slider.Output>
      </div>
      <Slider.Track>
        <Slider.Fill />
        <Slider.Thumb />
      </Slider.Track>
    </Slider>
  );
}

function MarkerCheckbox({ label, isSelected, isDisabled, onChange }) {
  return (
    <label
      className="polaris-settings-checkbox"
      data-disabled={isDisabled || undefined}
      data-selected={isSelected || undefined}
    >
      <input
        checked={isSelected}
        className="polaris-settings-checkbox-input"
        disabled={isDisabled}
        onChange={(event) => onChange(event.currentTarget.checked)}
        type="checkbox"
      />
      <span data-slot="checkbox-content">
        <span aria-hidden="true" data-slot="checkbox-control">
          <span data-slot="checkbox-indicator">✓</span>
        </span>
        <span>{label}</span>
      </span>
    </label>
  );
}

function MailIcon() {
  return (
    <svg aria-hidden="true" fill="none" focusable="false" viewBox="0 0 24 24">
      <path d="M4 6.5h16v11H4zM4.5 7l7.5 6 7.5-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.161-1.11-1.47-1.11-1.47-.908-.62.069-.608.069-.608 1.003.071 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.03-2.688-.103-.253-.447-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.748-1.026 2.748-1.026.546 1.379.202 2.398.1 2.65.64.7 1.029 1.595 1.029 2.688 0 3.848-2.339 4.695-4.566 4.944.359.31.678.921.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.481A10.019 10.019 0 0 0 22 12.017C22 6.484 17.523 2 12 2Z" fill="currentColor" />
    </svg>
  );
}

function SettingsPanel({ model }) {
  return (
    <div className="polaris-settings-shell default">
      <Card className="polaris-settings-card">
        <Card.Header className="polaris-settings-header">
          <div className="polaris-settings-app">
            <img alt="" height="16" src={model.iconUrl} width="16" />
            <Card.Title>{model.appName}</Card.Title>
          </div>
          <span className="polaris-settings-version">{model.version}</span>
        </Card.Header>
        <Separator />
        <Card.Content className="polaris-settings-body">
          <div className="polaris-settings-sliders">
            {model.fields.map((field) => (
              <SettingsSlider
                field={field}
                key={field.key}
                onChange={model.onConfigChange}
                onCommit={model.onConfigCommit}
              />
            ))}
          </div>
          <Separator />
          <section aria-label={model.markerTypesLabel} className="polaris-settings-marker-types">
            <span className="polaris-settings-section-label">{model.markerTypesLabel}</span>
            <div className="polaris-settings-checkboxes">
              {model.markerLevels.map((option) => (
                <MarkerCheckbox
                  isDisabled={option.isDisabled}
                  isSelected={option.isSelected}
                  key={option.key}
                  label={option.label}
                  onChange={(isSelected) => model.onMarkerLevelChange(option.level, isSelected)}
                />
              ))}
              <MarkerCheckbox
                isDisabled={false}
                isSelected={model.unorderedList.isSelected}
                label={model.unorderedList.label}
                onChange={model.onUnorderedListChange}
              />
            </div>
          </section>
          <Button className="polaris-settings-reset" fullWidth onPress={model.onReset} variant="secondary">
            {model.resetLabel}
          </Button>
        </Card.Content>
        <Separator />
        <Card.Footer className="polaris-settings-footer">
          <div aria-live="polite" className="polaris-settings-sync" role="status">
            <span aria-hidden="true" className={`polaris-settings-sync-dot${model.syncEnabled ? " is-enabled" : ""}`} />
            <span>{model.syncEnabled ? model.syncEnabledLabel : model.syncDisabledLabel}</span>
          </div>
          <div aria-label={model.contactLabel} className="polaris-settings-contact-actions">
            <a aria-label={model.emailLabel} className="polaris-settings-contact-action" href={model.emailUrl} title={model.emailLabel}>
              <MailIcon />
            </a>
            <a aria-label={model.issueLabel} className="polaris-settings-contact-action" href={model.issueUrl} rel="noreferrer" target="_blank" title={model.issueLabel}>
              <GitHubIcon />
            </a>
          </div>
        </Card.Footer>
      </Card>
    </div>
  );
}

export function mountSettingsPanel(host) {
  const shadowRoot = host.shadowRoot || host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = settingsStyles;
  const mountPoint = document.createElement("div");
  shadowRoot.replaceChildren(style, mountPoint);
  const root = createRoot(mountPoint);

  return {
    render(model) {
      root.render(<SettingsPanel model={model} />);
    },
    unmount() {
      root.unmount();
      shadowRoot.replaceChildren();
    }
  };
}
