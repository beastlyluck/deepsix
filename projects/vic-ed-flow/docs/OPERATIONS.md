# Operations — night supervisor huddle

## Open this first

`site/index.html` after `python main.py`. Streamlit `app.py` is the live-feeling board for a picked day.

## Order of reading

1. Four campus tiles. Red border = ramp > 20.
2. Occupancy vs bay cap. If the line sits on the dash, new arrivals ramp.
3. Flu attribution. If Austin week-2 arrivals jump and the others do not, it is the campus, not the weather.
4. Residual. Austin should be positive. If Alfred is also positive, the twin may have drifted.

## Decisions

- Divert ambulances away from a campus sitting on the bay cap
- Call extra beds before the 18:00 peak if residual is already up at midnight
- Do not staff to the point wait; staff to the ramp

## Reproduce

```
cd projects/vic-ed-flow
python main.py
streamlit run app.py
```
