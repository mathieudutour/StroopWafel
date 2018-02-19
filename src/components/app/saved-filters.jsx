import React from 'react'
import * as BS from 'react-bootstrap'
import { CloudUploadIcon, CloudDownloadIcon } from 'react-octicons'

const LOCALSTORAGE_KEY = 'saved-filters'

class AddFilterModal extends React.Component {
  onSave = () => {
    const { onHide } = this.props
    const data = JSON.parse(window.localStorage[LOCALSTORAGE_KEY] || '[]')
    const title = this._title.value
    data.push({ title: title, hashStr: window.location.hash })
    window.localStorage[LOCALSTORAGE_KEY] = JSON.stringify(data)
    onHide()
  }

  render() {
    return (
      <BS.Modal className="-add-filter-modal" {...this.props}>
        <BS.Modal.Header closeButton>
          <BS.Modal.Title>
            <CloudUploadIcon size="mega" /> Save Filter
          </BS.Modal.Title>
        </BS.Modal.Header>
        <BS.Modal.Body>
          <BS.FormControl
            type="text"
            inputRef={r => (this._title = r)}
            placeholder="Name of the filter..."
          />
        </BS.Modal.Body>
        <BS.Modal.Footer>
          <BS.Button bsStyle="primary" onClick={this.onSave}>
            Save
          </BS.Button>
        </BS.Modal.Footer>
      </BS.Modal>
    )
  }
}

class SavedFiltersButton extends React.Component {
  state = { showModal: false }

  showAddFilter = () => {
    this.setState({ showModal: true })
  }

  hideAddFilter = () => {
    this.setState({ showModal: false })
  }

  render() {
    const { showModal } = this.state
    const savedFilterData = JSON.parse(
      window.localStorage['saved-filters'] || '[]'
    )

    return (
      <BS.ButtonGroup className="saved-filters">
        <BS.Button onClick={this.showAddFilter} title="Save Filter">
          <CloudUploadIcon />
        </BS.Button>
        <BS.Dropdown id="save-filters-dropdown">
          <BS.Dropdown.Toggle>
            <CloudDownloadIcon />
          </BS.Dropdown.Toggle>
          <BS.Dropdown.Menu>
            <BS.MenuItem header>Apply Saved Filter</BS.MenuItem>
            {savedFilterData.length <= 0 && (
              <BS.MenuItem>No filter saved yet</BS.MenuItem>
            )}
            {savedFilterData.map(({ title, hashStr }) => {
              return (
                <BS.MenuItem key={hashStr} href={hashStr}>
                  {title}
                </BS.MenuItem>
              )
            })}
          </BS.Dropdown.Menu>
        </BS.Dropdown>
        <AddFilterModal show={showModal} onHide={this.hideAddFilter} />
      </BS.ButtonGroup>
    )
  }
}

export default SavedFiltersButton
