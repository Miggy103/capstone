import React, {Component} from 'react'
import {Link} from 'react-router-dom'
import firebase from 'app/fire'
import _ from 'lodash'
import FlatButton from 'material-ui/FlatButton'

// react components
import Reviews from './Reviews'

// tagging imports
import ChipInput from 'material-ui-chip-input'

export default class SingleStoryPage extends Component {
  constructor(props) {
    super(props)
    this.state = {
      currentStoryBranch: {},
      tags: [],
      imageURL: 'http://lorempixel.com/400/200/',
    }
  }

  componentDidMount() {
    const storyBranchId = this.props.match.params.branchId
    firebase.database().ref(`storyBranch/${storyBranchId}`).once('value', snap => {
      this.setState({currentStoryBranch: snap.val()})
    })
    // get tags for this story branch
    this.tagsListener = firebase.database().ref(`storyBranch/${this.props.match.params.branchId}/tags`)
    this.tagsListener.on('value', snap => {
      const tags = snap.val()
      if( tags ) {
        this.setState({
          tags: Object.keys(tags)
        })
      } // end if
    })
    // get an image from getty
    this.getImage(this.props.match.params.branchId)
  }

  componentWillUnmount() {
    if(this.tagsListener) this.tagsListener.off()
  }

  getImage = (query) => {
    const api = 'https://api.gettyimages.com/v3/search/images?fields=id,title,thumb,referral_destinations&sort_order=most_popular&phrase='
    const headers = { 'Api-Key': 'qk4wms73dv6nf7fjzb3q927k' }

    /* grabs the first image from getty API that matches the query */
    fetch(`${api}/${query}`, { headers })
      .then(res => res.json())
      .then(data => {
        const rand = Math.floor(Math.random() * data.images.length)
        this.setState({ imageURL: data.images[0].display_sizes[0].uri })
      })
      .catch(() => console.log("error"))

  }

  handleAddTag = (newTag) => {
    /*
    Here because data sent to firebase cannot contain
    ".", "#", "$", "[", "]"
    */
    if(newTag.includes(".")||newTag.includes("#")||newTag.includes("$")||newTag.includes("[")||newTag.includes("]")) {
      alert(`tags cannot contain ".", "#", "$", "[", or "]" `)
    } else {
      this.setState({
        tags: [...this.state.tags, newTag]
      })
      // add to tags db
      firebase.database().ref('tags').child(newTag).child(this.props.match.params.branchId).set(true)
      // add to tags in story db
      firebase.database().ref('storyBranch').child(this.props.match.params.branchId).child('tags').child(newTag).set(true)
    }
  }


  handleDeleteTag = (deleteMe) => {
    this.setState({
      tags: this.state.tags.filter(tag => tag !== deleteMe)
    })

    // remove from tags db
    firebase.database().ref('tags').child(deleteMe).child(this.props.match.params.branchId).remove()
    // remove this tag from story db
    firebase.database().ref('storyBranch').child(this.props.match.params.branchId).child('tags').child(deleteMe).remove()
  }

  render() {
    const storyBranchId = this.props.match.params.branchId
    const storyBranch = this.state.currentStoryBranch

    const getStoryRootTitle = () => {
      const roots = _.isEmpty(storyBranch) ? [] : storyBranch.storyRoot
      return roots.length > 1 ? roots[roots.length - 1].replace(/"/g,"") : storyBranchId.replace(/"/g,"")
    }
    console.log('WHAT IS THE IMAGE', this.state.imageURL)

    return (
      <div className="story-container">
        <div>
          <h2 className="align-center">{storyBranchId}</h2>
          <h4 className="align-center">Root:{' '}<a href={`/read/${getStoryRootTitle()}`}>"{getStoryRootTitle()}"</a></h4>
          <span>
            <img className="story-branch" src={this.state.imageURL} alt="This is an amazing picture." />
          </span>
          <br/>
        </div>
        <div className="start-read">
          {
            !_.isEmpty(storyBranch) &&
            <Link to={`/read/${storyBranchId}/${storyBranch.storyCards.shift()}`}><FlatButton label="Start Reading" backgroundColor="#50AD55"></FlatButton></Link>
          }
        </div>
        <div className="start-read">
          <ChipInput
            value={this.state.tags}
            fullWidth={true}
            hintText="Add a Tag"
            onRequestAdd={(chip) => this.handleAddTag(chip)}
            onRequestDelete={(chip) => this.handleDeleteTag(chip)}
            />
        </div>
        <Reviews storyId={storyBranchId}/>
      </div>
    )
  }
}
