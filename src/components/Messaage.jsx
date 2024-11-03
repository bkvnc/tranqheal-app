
import React from "react";

const Message = ({ notification }) => {
    const styles = {
        notificationHeader: {
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        fontSize: '20px',
        fontWeight: 'bold',
        },
        notificationBody: {
        marginTop: '10px',
        textAlign: 'center',
        },
        imageContainer: {
        display: 'flex',
        alignItems: 'center',
        height: '100px',
        objectFit: 'contain',
        },
    };
    return (
      <>
        <div id="notificationHeader" style={styles.notificationHeader}>
        
          {notification.image && (
            <div id="imageContainer" style={styles.imageContainer}>
              <img src={notification.image} width={100} />
            </div>
          )}
          <span>{notification.title}</span>
        </div>
        <div id="notificationBody" style={styles.notificationBody}>{notification.body}</div>
      </>
    );
  };
  
  export default Message;